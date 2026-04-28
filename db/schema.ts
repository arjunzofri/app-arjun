import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  date,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const rolEnum = pgEnum("rol", ["admin", "operador"]);
export const proveedorEnum = pgEnum("proveedor", ["vida_digital", "kingnex"]);
export const origenEnum = pgEnum("origen", ["winfac", "kingnex", "manual"]);

// Tables
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: rolEnum("rol").default("operador").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bodegas = pgTable("bodegas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(), // 'Bodega 1 Vida Digital' | 'Bodega 2 Vida Digital' | 'Bodega Arjun'
  descripcion: text("descripcion"),
});

export const modulosDestino = pgTable("modulos_destino", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(), // 'Módulo 180' | 'Módulo 182' | 'Módulo 183' | 'Módulo 184' | 'Módulo 193'
});

export const productos = pgTable("productos", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").unique().notNull(),
  descripcion: text("descripcion").notNull(),
  codigoPersonal: text("codigo_personal"),
  packing: integer("packing").default(1),
  ubicacion: text("ubicacion"),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productoImagenes = pgTable("producto_imagenes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoId: uuid("producto_id")
    .references(() => productos.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const codigoPersonalAuditoria = pgTable("codigo_personal_auditoria", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoId: uuid("producto_id")
    .references(() => productos.id, { onDelete: "cascade" })
    .notNull(),
  valorAnterior: text("valor_anterior"),
  valorNuevo: text("valor_nuevo"),
  usuarioId: uuid("usuario_id")
    .references(() => usuarios.id)
    .notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const notasVenta = pgTable("notas_venta", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroNv: text("numero_nv").notNull(),
  proveedor: proveedorEnum("proveedor").notNull(),
  fechaCompra: date("fecha_compra"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const entradas = pgTable("entradas", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoId: uuid("producto_id")
    .references(() => productos.id)
    .notNull(),
  notaVentaId: uuid("nota_venta_id").references(() => notasVenta.id),
  bodegaId: uuid("bodega_id")
    .references(() => bodegas.id)
    .notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 10, scale: 2 }),
  usuarioId: uuid("usuario_id")
    .references(() => usuarios.id)
    .notNull(),
  origen: origenEnum("origen").default("manual").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stock = pgTable("stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoId: uuid("producto_id")
    .references(() => productos.id)
    .notNull(),
  bodegaId: uuid("bodega_id")
    .references(() => bodegas.id)
    .notNull(),
  cantidadActual: integer("cantidad_actual").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const salidas = pgTable("salidas", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoId: uuid("producto_id")
    .references(() => productos.id)
    .notNull(),
  bodegaOrigenId: uuid("bodega_origen_id")
    .references(() => bodegas.id)
    .notNull(),
  moduloDestinoId: uuid("modulo_destino_id")
    .references(() => modulosDestino.id)
    .notNull(),
  cantidad: integer("cantidad").notNull(),
  usuarioId: uuid("usuario_id")
    .references(() => usuarios.id)
    .notNull(),
  timestampSalida: timestamp("timestamp_salida").defaultNow().notNull(),
  observaciones: text("observaciones"),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuarioId: uuid("usuario_id").references(() => usuarios.id),
  accion: text("accion").notNull(),
  tablaAfectada: text("tabla_afectada"),
  registroId: text("registro_id"),
  detalle: jsonb("detalle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const productoRelations = relations(productos, ({ many }) => ({
  imagenes: many(productoImagenes),
  entradas: many(entradas),
  stock: many(stock),
  salidas: many(salidas),
  auditoriaCodigo: many(codigoPersonalAuditoria),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  producto: one(productos, {
    fields: [stock.productoId],
    references: [productos.id],
  }),
  bodega: one(bodegas, {
    fields: [stock.bodegaId],
    references: [bodegas.id],
  }),
}));

export const entradasRelations = relations(entradas, ({ one }) => ({
  producto: one(productos, {
    fields: [entradas.productoId],
    references: [productos.id],
  }),
  notaVenta: one(notasVenta, {
    fields: [entradas.notaVentaId],
    references: [notasVenta.id],
  }),
  bodega: one(bodegas, {
    fields: [entradas.bodegaId],
    references: [bodegas.id],
  }),
  usuario: one(usuarios, {
    fields: [entradas.usuarioId],
    references: [usuarios.id],
  }),
}));

export const salidasRelations = relations(salidas, ({ one }) => ({
  producto: one(productos, {
    fields: [salidas.productoId],
    references: [productos.id],
  }),
  bodega: one(bodegas, {
    fields: [salidas.bodegaOrigenId],
    references: [bodegas.id],
  }),
  modulo: one(modulosDestino, {
    fields: [salidas.moduloDestinoId],
    references: [modulosDestino.id],
  }),
  usuario: one(usuarios, {
    fields: [salidas.usuarioId],
    references: [usuarios.id],
  }),
}));
