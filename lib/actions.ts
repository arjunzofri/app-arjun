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
        usuarioId: session.user.id,
      });
    }

    await db.update(productos).set({
      ...validated,
      updatedAt: new Date(),
    }).where(eq(productos.id, id));

    await db.insert(activityLog).values({
      usuarioId: session.user.id,
      accion: "PRODUCTO_EDITADO",
      tablaAfectada: "productos",
      registroId: id,
      detalle: validated,
    });
  } else {
    // Inheritance of location
    const existingSameCode = await db.query.productos.findFirst({
      where: eq(productos.codigo, validated.codigo),
    });

    const finalUbicacion = validated.ubicacion || (existingSameCode?.ubicacion || null);

    const [newProduct] = await db.insert(productos).values({
      ...validated,
      ubicacion: finalUbicacion,
    }).returning();

    await db.insert(activityLog).values({
      usuarioId: session.user.id,
      accion: "PRODUCTO_CREADO",
      tablaAfectada: "productos",
      registroId: newProduct.id,
      detalle: validated,
    });

    return newProduct;
  }

  revalidatePath("/dashboard/productos");
}

export async function registrarEntrada(data: any) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const validated = EntradaSchema.parse(data);

  return await db.transaction(async (tx) => {
    let nvId = null;
    if (validated.notaVentaNumero) {
      const [nv] = await tx.insert(notasVenta).values({
        numeroNv: validated.notaVentaNumero,
        proveedor: validated.proveedor || "vida_digital",
      }).onConflictDoUpdate({
        target: [notasVenta.id],
        set: { createdAt: new Date() }
      }).returning();
      nvId = nv.id;
    }

    const [entrada] = await tx.insert(entradas).values({
      productoId: validated.productoId,
      bodegaId: validated.bodegaId,
      notaVentaId: nvId,
      cantidad: validated.cantidad,
      precioUnitario: validated.precioUnitario?.toString(),
      usuarioId: session.user.id,
      origen: validated.origen,
    }).returning();

    const existingStock = await tx.query.stock.findFirst({
      where: and(eq(stock.productoId, validated.productoId), eq(stock.bodegaId, validated.bodegaId))
    });

    if (existingStock) {
      await tx.update(stock).set({
        cantidadActual: existingStock.cantidadActual + validated.cantidad,
        updatedAt: new Date(),
      }).where(eq(stock.id, existingStock.id));
    } else {
      await tx.insert(stock).values({
        productoId: validated.productoId,
        bodegaId: validated.bodegaId,
        cantidadActual: validated.cantidad,
      });
    }

    await tx.insert(activityLog).values({
      usuarioId: session.user.id,
      accion: "ENTRADA_REGISTRADA",
      tablaAfectada: "entradas",
      registroId: entrada.id,
      detalle: validated,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/productos");
    return entrada;
  });
}

export async function registrarSalida(data: any) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const validated = SalidaSchema.parse(data);

  return await db.transaction(async (tx) => {
    const existingStock = await tx.query.stock.findFirst({
      where: and(eq(stock.productoId, validated.productoId), eq(stock.bodegaId, validated.bodegaOrigenId))
    });

    if (!existingStock || existingStock.cantidadActual < validated.cantidad) {
      throw new Error("Stock insuficiente en la bodega seleccionada");
    }

    const [salida] = await tx.insert(salidas).values({
      ...validated,
      usuarioId: session.user.id,
    }).returning();

    await tx.update(stock).set({
      cantidadActual: existingStock.cantidadActual - validated.cantidad,
      updatedAt: new Date(),
    }).where(eq(stock.id, existingStock.id));

    await tx.insert(activityLog).values({
      usuarioId: session.user.id,
      accion: "SALIDA_REGISTRADA",
      tablaAfectada: "salidas",
      registroId: salida.id,
      detalle: validated,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/salidas");
    return salida;
  });
}
