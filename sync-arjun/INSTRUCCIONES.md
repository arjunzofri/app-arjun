# Sincronizador DBF WinFac Arjun → Neon

## 1. Instalar Python
Si no tienes Python, descárgalo de https://python.org (3.11 o superior).

## 2. Instalar dependencias
En PowerShell, desde la carpeta sync-arjun:
```
pip install -r requirements.txt
```

## 3. Configurar archivo .env
Copia `.env.example` a `.env` y verifica que `DATABASE_URL` tenga
la connection string correcta de Neon.

## 4. Crear schema y tablas en Neon (solo la primera vez)
Ejecuta `schema.sql` en Neon:
- Abre Neon SQL Editor en el dashboard
- Pega el contenido de `schema.sql`
- Ejecuta

O desde psql:
```
psql "postgresql://..." -f schema.sql
```

## 5. Probar manualmente
```
python sync_arjun_neon.py
```
Revisa los logs en la carpeta `logs/`.

## 6. Programar en Task Scheduler (Windows)
- Abre "Programador de tareas"
- Crear tarea básica
- Nombre: "Sync Arjun DBF Neon"
- Desencadenador: Diariamente a las 23:00
- Accion: Iniciar programa
  - Programa: python
  - Argumentos: C:\Users\pablo\Documents\app-arjun\sync-arjun\sync_arjun_neon.py
  - Iniciar en: C:\Users\pablo\Documents\app-arjun\sync-arjun\

## 7. Verificar logs
Los logs se guardan en `logs/` junto al script.
Cada ejecucion crea un archivo con fecha/hora.
`logs/latest.log` siempre tiene la ultima ejecucion.
