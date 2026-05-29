"""
sync_arjun_neon.py
==================
Sincroniza las tablas DBF de WinFac Arjun con Neon PostgreSQL.
Schema: arjun

Requisitos:
    pip install -r requirements.txt

Configuracion:
    Crea un archivo .env en la misma carpeta con:
    DATABASE_URL=postgresql://...

Programar en Task Scheduler:
    - Programa: python
    - Argumentos: C:\\...\\sync-arjun\\sync_arjun_neon.py
    - Frecuencia: Diario, 23:00
"""

import os
import sys
import json
import logging
from datetime import datetime, date
from decimal import Decimal
from xml.etree import ElementTree

from dbfread import DBF
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# ============================================================
# CONFIGURACION
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

# Ruta base de los DBF de Arjun
DBF_PATH = r"C:\sisvfp\WinFac_sve"

# Tablas a sincronizar
TABLAS = {
    "inventar": {
        "dbf_file": "inventar.DBF",
        "pk_columns": ["knumezet"],
        "columnas": [
            "knumezet", "codunico", "descript", "stocdisp", "cifunita",
            "cosunita", "cantcaja", "fechaing"
        ],
    },
    "inv_sdo": {
        "dbf_file": "inv_sdo.DBF",
        "pk_columns": ["knumezet"],
        "columnas": [
            "knumezet", "codunico", "descript", "stocdisp", "cifunita",
            "cosunita", "cantcaja", "vendedor_rut"
        ],
    },
    "infnvta": {
        "dbf_file": "infnvta.DBF",
        "pk_columns": ["nota", "zeta"],
        "columnas": [
            "nota", "zeta", "fecha", "codigo", "descri",
            "canti", "modulo", "pdoc", "prea"
        ],
    },
    "inv": {
        "dbf_file": "inv.DBF",
        "dbf_path_override": r"C:\sisvfp\winmod\inv.DBF",
        "pk_columns": ["zeta"],
        "columnas": [
            "zeta", "codigo", "descrip", "saldo", "cif",
            "costo", "cancaja", "factura", "nro_dsm",
            "moduloss", "fechaing"
        ],
    },
}

# ============================================================
# LOGGING
# ============================================================
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f"sync_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
latest_log = os.path.join(LOG_DIR, "latest.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

try:
    if os.path.exists(latest_log):
        os.remove(latest_log)
    import shutil
    shutil.copy(log_file, latest_log)
except Exception:
    pass


# ============================================================
# HELPERS
# ============================================================

def safe_value(val):
    """Convierte valores DBF a tipos compatibles con PostgreSQL."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return val
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, datetime):
        return val
    if isinstance(val, date):
        return val
    if isinstance(val, bool):
        return val
    if isinstance(val, bytes):
        return val.decode("latin-1", errors="replace").strip()
    s = str(val).strip()
    return s if s != "" else None


def json_safe(val):
    """Convierte cualquier valor a un tipo serializable a JSON."""
    if val is None:
        return None
    if isinstance(val, (int, float, bool)):
        return val
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, bytes):
        return val.decode("latin-1", errors="replace").strip()
    s = str(val).strip()
    return s if s != "" else None


def read_dbf(path, columnas):
    """Lee un archivo DBF y retorna lista de dicts con columnas mapeadas + raw."""
    try:
        table = DBF(path, encoding="latin-1", ignore_missing_memofile=True)
        rows = []
        for record in table:
            row = {}
            raw = {}
            for field_name in record:
                raw[field_name.lower()] = json_safe(record[field_name])
            row["raw"] = json.dumps(raw, ensure_ascii=False)
            for col in columnas:
                val = record.get(col.upper())
                if val is None:
                    val = record.get(col.lower())
                row[col.lower()] = safe_value(val)
            rows.append(row)
        log.info("  Leidas %d filas de %s", len(rows), os.path.basename(path))
        return rows
    except Exception as e:
        log.error("  Error leyendo %s: %s", path, e)
        return []


def sync_tabla(conn, tabla, config, dbf_path):
    """Sincroniza una tabla DBF con Neon usando UPSERT."""
    log.info("Sincronizando arjun.%s...", tabla)

    rows = read_dbf(dbf_path, config["columnas"])
    if not rows:
        log.warning("  Sin datos para arjun.%s", tabla)
        return 0

    columnas = config["columnas"]
    pk = config["pk_columns"]

    before = len(rows)

    def _pk_valida(val):
        if val is None:
            return False
        if isinstance(val, bytes):
            return val.strip() not in (b"", b" ")
        s = str(val).strip()
        return s not in ("", " ")

    rows = [r for r in rows if all(_pk_valida(r.get(k)) for k in pk)]
    skipped = before - len(rows)
    if skipped > 0:
        log.info("  Omitidas %d filas con PK nula/vacia", skipped)

    seen = {}
    for row in rows:
        key = tuple(row[k] for k in pk)
        seen[key] = row
    rows = list(seen.values())
    deduped = before - skipped - len(rows)
    if deduped > 0:
        log.info("  Deduplicadas %d filas en memoria", deduped)

    if not rows:
        log.warning("  Sin filas validas para arjun.%s", tabla)
        return 0

    # Enriquecer inv_sdo con vendedor_rut desde XML
    if tabla == "inv_sdo":
        for row in rows:
            row["vendedor_rut"] = leer_vendedor_rut(row.get("knumezet", ""))

    all_columns = columnas + ["raw"]
    update_cols = [c for c in columnas if c not in pk]
    update_set = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_cols])
    update_set += ", raw = EXCLUDED.raw"

    insert_sql = f"""
        INSERT INTO arjun.{tabla} ({', '.join(all_columns)})
        VALUES %s
        ON CONFLICT ({', '.join(pk)}) DO UPDATE SET
        {update_set}
    """

    values = []
    for row in rows:
        tup = tuple(row[c] for c in columnas) + (row["raw"],)
        values.append(tup)

    try:
        with conn.cursor() as cur:
            execute_values(cur, insert_sql, values, page_size=500)
        conn.commit()
        log.info("  %d registros sincronizados en arjun.%s", len(rows), tabla)
        return len(rows)
    except Exception as e:
        conn.rollback()
        log.error("  Error en arjun.%s: %s", tabla, e)
        return 0


# ============================================================
# VENDEDOR RUT
# ============================================================

DOCSVE_PATH = r"Z:\newdesar\winfac_sve\base\docsve"


def leer_vendedor_rut(knumezet):
    """
    Extrae el vendedor_rut_numero desde el XML de visación correspondiente.
    Retorna el RUT como string o None si el archivo no existe o falla el parseo.
    No lanza excepciones.
    """
    if not knumezet:
        return None
    try:
        # Visación base: primeros 3 segmentos separados por "-"
        partes = knumezet.split("-")
        if len(partes) < 3:
            return None
        visacion = "-".join(partes[:3])
        xml_path = os.path.join(DOCSVE_PATH, f"{visacion}.xml")
        if not os.path.exists(xml_path):
            return None
        tree = ElementTree.parse(xml_path)
        root = tree.getroot()
        el = root.find("vendedor_rut_numero")
        if el is not None and el.text:
            return el.text.strip()
        return None
    except Exception:
        return None


# ============================================================
# MAIN
# ============================================================

def main():
    log.info("=" * 60)
    log.info("INICIO SINCRONIZACION WinFac Arjun -> Neon")
    log.info("Hora: %s", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    log.info("BASE_DIR: %s", BASE_DIR)
    log.info("DBF_PATH: %s", DBF_PATH)
    log.info("=" * 60)

    if not DATABASE_URL:
        log.error("DATABASE_URL no configurada. Revisa archivo .env")
        sys.exit(1)

    if not os.path.exists(DBF_PATH):
        log.error("Carpeta DBF no encontrada: %s", DBF_PATH)
        sys.exit(1)

    try:
        conn = psycopg2.connect(DATABASE_URL)
        log.info("Conectado a Neon PostgreSQL")
    except Exception as e:
        log.error("No se pudo conectar a Neon: %s", e)
        sys.exit(1)

    total_sync = 0

    for tabla, config in TABLAS.items():
        if "dbf_path_override" in config:
            dbf_path = config["dbf_path_override"]
        else:
            dbf_path = os.path.join(DBF_PATH, config["dbf_file"])
        if not os.path.exists(dbf_path):
            log.warning("  Archivo no encontrado: %s", dbf_path)
            continue
        total_sync += sync_tabla(conn, tabla, config, dbf_path)

    conn.close()

    log.info("")
    log.info("=" * 60)
    log.info("SINCRONIZACION COMPLETADA - %d registros procesados", total_sync)
    log.info("Log guardado en: %s", log_file)
    log.info("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logging.exception("ERROR CRITICO NO CONTROLADO: %s", e)
        sys.exit(1)
