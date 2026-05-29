-- add_traslados.sql
-- Agrega tabla de traslados entre bodegas.
-- Ejecutar en Neon antes del deploy.

CREATE TABLE IF NOT EXISTS public.traslados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  bodega_origen_id uuid NOT NULL REFERENCES public.bodegas(id),
  bodega_destino_id uuid NOT NULL REFERENCES public.bodegas(id),
  cantidad integer NOT NULL CHECK (cantidad > 0),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id),
  observaciones text,
  created_at timestamp DEFAULT now() NOT NULL
);
