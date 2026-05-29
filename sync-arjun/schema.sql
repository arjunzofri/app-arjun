-- schema.sql
-- Crea el schema arjun y las tablas para la sincronizacion DBF -> Neon.
-- Ejecutar UNA SOLA VEZ en Neon antes de correr el script Python.

CREATE SCHEMA IF NOT EXISTS arjun;

CREATE TABLE IF NOT EXISTS arjun.inventar (
  knumezet TEXT PRIMARY KEY,
  codunico TEXT,
  descript TEXT,
  stocdisp NUMERIC,
  cifunita NUMERIC,
  cosunita NUMERIC,
  cantcaja NUMERIC,
  fechaing DATE,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS arjun.inv_sdo (
  knumezet TEXT PRIMARY KEY,
  codunico TEXT,
  descript TEXT,
  stocdisp NUMERIC,
  cifunita NUMERIC,
  cosunita NUMERIC,
  cantcaja NUMERIC,
  raw JSONB
);

ALTER TABLE arjun.inv_sdo ADD COLUMN IF NOT EXISTS vendedor_rut TEXT;

CREATE TABLE IF NOT EXISTS arjun.inv (
  zeta TEXT PRIMARY KEY,
  codigo TEXT,
  descrip TEXT,
  saldo NUMERIC,
  cif NUMERIC,
  costo NUMERIC,
  cancaja NUMERIC,
  factura TEXT,
  nro_dsm TEXT,
  moduloss TEXT,
  fechaing DATE,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS arjun.infnvta (
  nota TEXT,
  zeta TEXT,
  fecha DATE,
  codigo TEXT,
  descri TEXT,
  canti NUMERIC,
  modulo TEXT,
  pdoc NUMERIC,
  prea NUMERIC,
  raw JSONB,
  PRIMARY KEY (nota, zeta)
);
