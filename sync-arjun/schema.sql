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
