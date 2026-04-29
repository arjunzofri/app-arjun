"use server";

import { db } from "@/db";
import { productos, stock, entradas, notasVenta, activityLog, codigoPersonalAuditoria, salidas } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ProductoSchema, EntradaSchema, SalidaSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createOrUpdateProducto(data: any) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const validated = ProductoSchema.parse(data);
  const id = data.id;

  if (id) {
    const existing = await db.query.productos.findFirst({
      where: eq(productos.id, id),
    });

    if (existing && existing.codigoPersonal !== validated.codigoPersonal) {
      await db.insert(codigoPersonalAuditoria).values({
        productoId: id,
        valorAnterior: existing.codigoPersonal,
        valorNuevo: validated.codigoPersonal || null,
        usuarioId: session.user?.id ?? "",
      });
    }

    await db.update(productos).set({
      ...validated,
      updatedAt: new Date(),
    }).where(eq(productos.id, id));

    await db.insert(activityLog).values({
      usuarioId: session.user?.id ?? "",
      accion: "PRODUCTO_EDITADO",
      tablaAfectada: "productos",
      registroId: id,
      detalle: validated,
    });

    revalidatePath("/productos")
    const updated = await db.query.productos.findFirst({ where: eq(productos.id, id) })
    return updated
  } else {
    // Buscar si ya existe un producto con ese código
    const existingSameCode = await db.query.productos.findFirst({
      where: eq(productos.codigo, validated.codigo),
    });

    if (existingSameCode) {
      // El código ya existe → hacer UPDATE heredando ubicación
      const finalUbicacion = validated.ubicacion || existingSameCode.ubicacion;

      // Auditar cambio de codigoPersonal si cambió
      if (existingSameCode.codigoPersonal !== validated.codigoPersonal) {
        await db.insert(codigoPersonalAuditoria).values({
          productoId: existingSameCode.id,
          valorAnterior: existingSameCode.codigoPersonal,
          valorNuevo: validated.codigoPersonal || null,
          usuarioId: session.user?.id ?? "",
        });
      }

      await db.update(productos).set({
        ...validated,
        ubicacion: finalUbicacion,
        updatedAt: new Date(),
      }).where(eq(productos.id, existingSameCode.id));

      await db.insert(activityLog).values({
        usuarioId: session.user?.id ?? "",
        accion: "PRODUCTO_ACTUALIZADO",
        tablaAfectada: "productos",
        registroId: existingSameCode.id,
        detalle: validated,
      });

      revalidatePath("/productos");
      return existingSameCode;

    } else {
      // Código nuevo → INSERT
      const finalUbicacion = validated.ubicacion || null;

      const [newProduct] = await db.insert(productos).values({
        ...validated,
        ubicacion: finalUbicacion,
      }).returning();

      await db.insert(activityLog).values({
        usuarioId: session.user?.id ?? "",
        accion: "PRODUCTO_CREADO",
        tablaAfectada: "productos",
        registroId: newProduct.id,
        detalle: validated,
      });

      revalidatePath("/productos");
      return newProduct;
    }
  }

  revalidatePath("/productos");
}

export async function registrarEntrada(data: any) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const validated = EntradaSchema.parse(data);

  let nvId = null;
  if (validated.notaVentaNumero) {
    const [nv] = await db.insert(notasVenta).values({
      numeroNv: validated.notaVentaNumero,
      proveedor: validated.proveedor || "vida_digital",
    }).onConflictDoUpdate({
      target: [notasVenta.numeroNv],
      set: { createdAt: new Date() }
    }).returning();
    nvId = nv.id;
  }

  const [entrada] = await db.insert(entradas).values({
    productoId: validated.productoId,
    bodegaId: validated.bodegaId,
    notaVentaId: nvId,
    cantidad: validated.cantidad,
    precioUnitario: validated.precioUnitario?.toString(),
    usuarioId: session.user?.id ?? "",
    origen: validated.origen,
  }).returning();

  const existingStock = await db.query.stock.findFirst({
    where: and(eq(stock.productoId, validated.productoId), eq(stock.bodegaId, validated.bodegaId))
  });

  if (existingStock) {
    await db.update(stock).set({
      cantidadActual: existingStock.cantidadActual + validated.cantidad,
      updatedAt: new Date(),
    }).where(eq(stock.id, existingStock.id));
  } else {
    await db.insert(stock).values({
      productoId: validated.productoId,
      bodegaId: validated.bodegaId,
      cantidadActual: validated.cantidad,
    });
  }

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "ENTRADA_REGISTRADA",
    tablaAfectada: "entradas",
    registroId: entrada.id,
    detalle: validated,
  });

  revalidatePath("/");
  revalidatePath("/productos");
  return entrada;
}

export async function registrarSalida(data: any) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const validated = SalidaSchema.parse(data);

  const existingStock = await db.query.stock.findFirst({
    where: and(eq(stock.productoId, validated.productoId), eq(stock.bodegaId, validated.bodegaOrigenId))
  });

  if (!existingStock || existingStock.cantidadActual < validated.cantidad) {
    throw new Error("Stock insuficiente en la bodega seleccionada");
  }

  const [salida] = await db.insert(salidas).values({
    productoId: validated.productoId,
    bodegaOrigenId: validated.bodegaOrigenId,
    moduloDestinoId: validated.moduloDestinoId,
    cantidad: validated.cantidad,
    observaciones: validated.observaciones,
    usuarioId: session.user?.id ?? "",
  }).returning();

  await db.update(stock).set({
    cantidadActual: existingStock.cantidadActual - validated.cantidad,
    updatedAt: new Date(),
  }).where(eq(stock.id, existingStock.id));

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "SALIDA_REGISTRADA",
    tablaAfectada: "salidas",
    registroId: salida.id,
    detalle: validated,
  });

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/salidas");
  return salida;
}

