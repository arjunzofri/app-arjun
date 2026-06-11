CREATE TABLE public.retornos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos(id),
  modulo_origen_id UUID NOT NULL REFERENCES public.modulos_destino(id),
  bodega_destino_id UUID NOT NULL REFERENCES public.bodegas(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
