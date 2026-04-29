import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

export const ProductoSchema = z.object({
  codigo: z.string().min(1, "Código requerido"),
  descripcion: z.string().min(1, "Descripción requerida"),
  codigoPersonal: z.string().optional(),
  packing: z.number().int().positive(),
  ubicacion: z.string().optional(),
  observaciones: z.string().optional(),
});

export const EntradaSchema = z.object({
  productoId: z.string().uuid(),
  bodegaId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().optional(),
  notaVentaNumero: z.string().optional(),
  proveedor: z.enum(["vida_digital", "kingnex"]).optional(),
  origen: z.enum(["winfac", "kingnex", "manual"]).default("manual"),
});

export const SalidaSchema = z.object({
  productoId: z.string().uuid(),
  bodegaOrigenId: z.string().uuid(),
  moduloDestinoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  observaciones: z.string().optional(),
});

export const UsuarioSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  rol: z.enum(["admin", "operador"]),
});

export const KingnexOCRResponseSchema = z.object({
  numero_nv: z.string(),
  fecha: z.string(),
  items: z.array(z.object({
    sku: z.string(),
    descripcion: z.string(),
    cantidad: z.number(),
    precio_unitario: z.number()
  }))
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type ProductoInput = z.infer<typeof ProductoSchema>;
export type EntradaInput = z.infer<typeof EntradaSchema>;
export type SalidaInput = z.infer<typeof SalidaSchema>;
export type UsuarioInput = z.infer<typeof UsuarioSchema>;
export type KingnexOCRResponse = z.infer<typeof KingnexOCRResponseSchema>;
