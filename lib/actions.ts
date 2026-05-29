"use server";

import { db } from "@/db";
import { productos, stock, stockModulos, entradas, notasVenta, activityLog, codigoPersonalAuditoria, salidas, bodegas, productoImagenes } from "@/db/schema";
import { eq, sql, and, ilike, or, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ProductoSchema, EntradaSchema, SalidaSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { getVisaCorte } from "@/lib/utils/get-visa-corte";

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

  // Si es entrada de Vida Digital, asignar bodega por defecto al producto
  if (validated.proveedor === "vida_digital") {
    const producto = await db.query.productos.findFirst({
      where: eq(productos.id, validated.productoId),
    });
    if (producto && !producto.ubicacion) {
      const bodegaVD = await db.query.bodegas.findFirst({
        where: sql`${bodegas.nombre} ILIKE '%Bodega 1 Vida Digital%'`,
      });
      if (bodegaVD) {
        await db.update(productos)
          .set({ ubicacion: bodegaVD.nombre, updatedAt: new Date() })
          .where(eq(productos.id, validated.productoId));
      }
    }
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
    return {
      error: `Stock insuficiente. Disponible: ${existingStock?.cantidadActual ?? 0} unidades en esa bodega.`
    };
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

  // Upsert stock_modulos (acumulado por módulo)
  const existingModuloStock = await db.query.stockModulos.findFirst({
    where: and(
      eq(stockModulos.productoId, validated.productoId),
      eq(stockModulos.moduloId, validated.moduloDestinoId)
    )
  });
  if (existingModuloStock) {
    await db.update(stockModulos).set({
      cantidadAcumulada: existingModuloStock.cantidadAcumulada + validated.cantidad,
      updatedAt: new Date(),
    }).where(eq(stockModulos.id, existingModuloStock.id));
  } else {
    await db.insert(stockModulos).values({
      productoId: validated.productoId,
      moduloId: validated.moduloDestinoId,
      cantidadAcumulada: validated.cantidad,
    });
  }

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "SALIDA_REGISTRADA",
    tablaAfectada: "salidas",
    registroId: salida.id,
    detalle: validated,
  });

  // Guardar bodega como ubicación del producto para futuras salidas
  const bodegaSeleccionada = await db.query.bodegas.findFirst({
    where: eq(bodegas.id, validated.bodegaOrigenId)
  });
  if (bodegaSeleccionada) {
    await db.update(productos).set({ ubicacion: bodegaSeleccionada.nombre })
      .where(eq(productos.id, validated.productoId));
  }

  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/salidas");
  return salida;
}

export async function actualizarStock(productoId: string, bodegaId: string, cantidadActual: number) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const existingStock = await db.query.stock.findFirst({
    where: and(eq(stock.productoId, productoId), eq(stock.bodegaId, bodegaId))
  });

  if (!existingStock) {
    await db.insert(stock).values({
      productoId,
      bodegaId,
      cantidadActual,
      updatedAt: new Date(),
    });
  } else {
    await db.update(stock).set({
      cantidadActual,
      updatedAt: new Date(),
    }).where(eq(stock.id, existingStock.id));
  }

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "STOCK_ACTUALIZADO",
    tablaAfectada: "stock",
    registroId: existingStock?.id ?? productoId,
    detalle: { productoId, bodegaId, cantidadActual },
  });

  revalidatePath("/");
  revalidatePath("/mobile/stock");
}

export async function getStockWinfac(codigo: string): Promise<number> {
  const s = neon(process.env.DATABASE_URL!);
  const rows = await s`SELECT COALESCE(SUM(stocdisp), 0) as total FROM arjun.inv_sdo WHERE codunico = ${codigo}`;
  return Number(rows[0]?.total) || 0;
}

export async function registrarConteoFisico(productoId: string, bodegaId: string, cantidad: number) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  // Insertar entrada de conteo físico
  await db.insert(entradas).values({
    productoId,
    bodegaId,
    cantidad,
    usuarioId: session.user?.id ?? "",
    origen: "conteo_fisico",
  });

  // Upsert stock
  const existingStock = await db.query.stock.findFirst({
    where: and(eq(stock.productoId, productoId), eq(stock.bodegaId, bodegaId))
  });

  if (existingStock) {
    await db.update(stock).set({
      cantidadActual: cantidad,
      updatedAt: new Date(),
    }).where(eq(stock.id, existingStock.id));
  } else {
    await db.insert(stock).values({
      productoId,
      bodegaId,
      cantidadActual: cantidad,
      updatedAt: new Date(),
    });
  }

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "CONTEO_FISICO",
    tablaAfectada: "stock",
    registroId: productoId,
    detalle: { productoId, bodegaId, cantidad },
  });

  revalidatePath("/");
  revalidatePath("/mobile/stock");
  return { success: true };
}

export async function actualizarUbicacionProducto(productoId: string, bodegaId: string) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const bodega = await db.query.bodegas.findFirst({
    where: eq(bodegas.id, bodegaId)
  });
  if (!bodega) throw new Error("Bodega no encontrada");

  await db.update(productos)
    .set({ ubicacion: bodega.nombre, updatedAt: new Date() })
    .where(eq(productos.id, productoId));

  revalidatePath("/salidas");
  return { ubicacion: bodega.nombre };
}

export async function buscarProductos(query: string) {
  if (!query || query.trim().length < 2) return []

  const corte = await getVisaCorte();

  const results = await db.select({
    id: productos.id,
    codigo: productos.codigo,
    knumezet: productos.knumezet,
    codigoPersonal: productos.codigoPersonal,
    descripcion: productos.descripcion,
    packing: productos.packing,
    ubicacion: productos.ubicacion,
    totalStock: sql<number>`COALESCE(SUM(${stock.cantidadActual}), 0)`
  })
  .from(productos)
  .leftJoin(stock, sql`${productos.id} = ${stock.productoId}`)
  .where(
    and(
      or(
        ilike(productos.codigo, `%${query}%`),
        ilike(productos.descripcion, `%${query}%`),
        ilike(productos.codigoPersonal, `%${query}%`),
        ilike(productos.knumezet, `%${query}%`)
      ),
      sql`(${productos.knumezet} IS NULL OR (split_part(${productos.knumezet}, '-', 2)::bigint * 1000000 + split_part(${productos.knumezet}, '-', 3)::bigint) >= ${corte})`
    )
  )
  .groupBy(productos.id)
  .having(sql`COALESCE(SUM(${stock.cantidadActual}), 0) > 0`)
  .orderBy(productos.codigo)
  .limit(20)

  return results
}

export async function editarProducto(id: string, data: {
  codigoPersonal?: string;
  descripcion?: string;
  packing?: number;
  observaciones?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const existing = await db.query.productos.findFirst({
    where: eq(productos.id, id),
  });
  if (!existing) throw new Error("Producto no encontrado");

  await db.update(productos).set({
    codigoPersonal: data.codigoPersonal ?? existing.codigoPersonal,
    descripcion: data.descripcion ?? existing.descripcion,
    packing: data.packing ?? existing.packing,
    observaciones: data.observaciones ?? existing.observaciones,
    updatedAt: new Date(),
  }).where(eq(productos.id, id));

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "PRODUCTO_EDITADO",
    tablaAfectada: "productos",
    registroId: id,
    detalle: data,
  });

  revalidatePath("/");
  revalidatePath("/entradas");
  revalidatePath("/salidas");
  return { success: true };
}

export async function eliminarProducto(id: string) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");
  if (session.user?.role !== "admin") throw new Error("Solo administradores pueden eliminar productos");

  const stocks = await db.query.stock.findMany({
    where: eq(stock.productoId, id),
  });
  const totalStock = stocks.reduce((sum, s) => sum + s.cantidadActual, 0);

  if (totalStock > 0) {
    return { error: `No se puede eliminar — el producto tiene ${totalStock} unidades en stock` };
  }

  // Eliminar dependientes en orden (FK constraints)
  await db.delete(activityLog).where(eq(activityLog.registroId, id));
  await db.delete(productoImagenes).where(eq(productoImagenes.productoId, id));
  await db.delete(stockModulos).where(eq(stockModulos.productoId, id));
  await db.delete(stock).where(eq(stock.productoId, id));
  await db.delete(entradas).where(eq(entradas.productoId, id));
  await db.delete(salidas).where(eq(salidas.productoId, id));

  // Registrar antes de borrar el producto (la referencia se pierde despues)
  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "PRODUCTO_ELIMINADO",
    tablaAfectada: "productos",
    registroId: id,
    detalle: { id },
  });

  await db.delete(productos).where(eq(productos.id, id));

  revalidatePath("/");
  revalidatePath("/entradas");
  revalidatePath("/salidas");
  return { success: true };
}

export async function eliminarEntrada(entradaId: string) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");
  if (session.user?.role !== "admin")
    throw new Error("Solo administradores pueden eliminar entradas");

  const entrada = await db.query.entradas.findFirst({
    where: eq(entradas.id, entradaId),
  });
  if (!entrada) {
    return { error: "Entrada no encontrada" };
  }

  // Ajustar stock restando la cantidad de la entrada eliminada
  const stockRecord = await db.query.stock.findFirst({
    where: and(
      eq(stock.productoId, entrada.productoId),
      eq(stock.bodegaId, entrada.bodegaId)
    ),
  });

  let stockAnterior: number | null = null;
  let stockNuevo: number | null = null;

  if (stockRecord) {
    stockAnterior = stockRecord.cantidadActual;
    stockNuevo = Math.max(0, stockAnterior - entrada.cantidad);
    await db.update(stock)
      .set({ cantidadActual: stockNuevo, updatedAt: new Date() })
      .where(eq(stock.id, stockRecord.id));
  }

  await db.delete(entradas).where(eq(entradas.id, entradaId));

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "ELIMINAR_ENTRADA",
    tablaAfectada: "entradas",
    registroId: entradaId,
    detalle: {
      productoId: entrada.productoId,
      bodegaId: entrada.bodegaId,
      cantidadEliminada: entrada.cantidad,
      stockAnterior,
      stockNuevo,
    },
  });

  revalidatePath("/");
  revalidatePath("/entradas");
  return { success: true };
}

export async function editarStockModulo(
  productoId: string,
  moduloId: string,
  data: { cantidadAcumulada: number }
) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");

  const existing = await db.query.stockModulos.findFirst({
    where: and(
      eq(stockModulos.productoId, productoId),
      eq(stockModulos.moduloId, moduloId)
    ),
  });
  if (!existing) throw new Error("Registro no encontrado");

  const cantidadAnterior = existing.cantidadAcumulada;
  const cantidadNueva = data.cantidadAcumulada;
  const diferencia = cantidadAnterior - cantidadNueva;

  // Buscar bodega origen desde la última salida
  const ultimaSalida = await db.query.salidas.findFirst({
    where: and(
      eq(salidas.productoId, productoId),
      eq(salidas.moduloDestinoId, moduloId)
    ),
    orderBy: [desc(salidas.timestampSalida)],
  });
  if (!ultimaSalida) {
    return { error: "No se encontró bodega origen para ajustar el stock" };
  }
  const bodegaOrigenId = ultimaSalida.bodegaOrigenId;

  // Si se aumentó la cantidad, verificar stock suficiente
  if (diferencia < 0) {
    const bodegaStock = await db.query.stock.findFirst({
      where: and(
        eq(stock.productoId, productoId),
        eq(stock.bodegaId, bodegaOrigenId)
      ),
    });
    const disponible = bodegaStock?.cantidadActual ?? 0;
    if (disponible < Math.abs(diferencia)) {
      return {
        error: `Stock insuficiente en bodega origen. Disponible: ${disponible} unidades.`,
      };
    }
  }

  const s = neon(process.env.DATABASE_URL!);

  const queries: any[] = [
    s`UPDATE stock_modulos SET cantidad_acumulada = ${cantidadNueva}, updated_at = NOW() WHERE id = ${existing.id}`,
  ];

  if (diferencia !== 0) {
    queries.push(
      s`UPDATE stock SET cantidad_actual = cantidad_actual + ${diferencia}, updated_at = NOW() WHERE producto_id = ${productoId}::uuid AND bodega_id = ${bodegaOrigenId}::uuid`
    );
  }

  queries.push(
    s`INSERT INTO activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle) VALUES (${session.user?.id ?? ""}::uuid, 'STOCK_MODULO_EDITADO', 'stock_modulos', ${existing.id}::uuid, ${JSON.stringify({ productoId, moduloId, bodegaOrigenId, cantidadAnterior, cantidadNueva, diferencia, ajusteStock: true })}::jsonb)`
  );

  await s.transaction(queries);

  revalidatePath("/modulos");
  return { success: true };
}

export async function eliminarStockModulo(productoId: string, moduloId: string) {
  const session = await auth();
  if (!session) throw new Error("No autorizado");
  if (session.user?.role !== "admin")
    throw new Error("Solo administradores pueden eliminar registros de módulo");

  const existing = await db.query.stockModulos.findFirst({
    where: and(
      eq(stockModulos.productoId, productoId),
      eq(stockModulos.moduloId, moduloId)
    ),
  });
  if (!existing) throw new Error("Registro no encontrado");

  await db.delete(stockModulos).where(eq(stockModulos.id, existing.id));

  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "STOCK_MODULO_ELIMINADO",
    tablaAfectada: "stock_modulos",
    registroId: existing.id,
    detalle: { productoId, moduloId, cantidadAcumulada: existing.cantidadAcumulada },
  });

  revalidatePath("/modulos");
  return { success: true };
}

