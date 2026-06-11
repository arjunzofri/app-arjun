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
  if (!session) return { error: "No autorizado" };

  const parsed = ProductoSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };
  const validated = parsed.data;
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
    if (!updated) return { error: "Producto no encontrado después de actualizar" };
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
      const updatedSameCode = await db.query.productos.findFirst({ where: eq(productos.id, existingSameCode.id) });
      if (!updatedSameCode) return { error: "Producto no encontrado después de actualizar" };
      return updatedSameCode;

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
  if (!session) return { error: "No autorizado" };

  const parsed = EntradaSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };
  const validated = parsed.data;

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

  // UPSERT atómico para evitar race condition (lost update)
  const upsertStock = neon(process.env.DATABASE_URL!);
  await upsertStock`
    INSERT INTO stock (producto_id, bodega_id, cantidad_actual)
    VALUES (${validated.productoId}::uuid, ${validated.bodegaId}::uuid, ${validated.cantidad})
    ON CONFLICT (producto_id, bodega_id)
    DO UPDATE SET cantidad_actual = stock.cantidad_actual + EXCLUDED.cantidad_actual
  `;

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
  if (!session) return { error: "No autorizado" };

  const parsed = SalidaSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };
  const validated = parsed.data;

  const s = neon(process.env.DATABASE_URL!);

  // 1. Lectura previa SOLO para mensaje de error con cantidad disponible
  const [stockRow] = await s`
    SELECT cantidad_actual FROM stock
    WHERE producto_id = ${validated.productoId}::uuid
      AND bodega_id = ${validated.bodegaOrigenId}::uuid
  `;

  const disponible: number = stockRow?.cantidad_actual ?? 0;
  if (disponible < validated.cantidad) {
    return {
      error: `Stock insuficiente. Disponible: ${disponible} unidades en esa bodega.`
    };
  }

  // 2. CTE atómico: INSERT salida + UPDATE stock en una sola sentencia.
  //    FOR UPDATE bloquea la fila stock mientras se ejecuta el CTE.
  //    Si stock_row.cantidad_actual < cantidad, inserted_salida retorna 0 filas
  //    y update_stock no modifica nada → atómico y sin salidas huérfanas.
  const [salida] = await s`
    WITH stock_row AS (
      SELECT id, cantidad_actual FROM stock
      WHERE producto_id = ${validated.productoId}::uuid
        AND bodega_id = ${validated.bodegaOrigenId}::uuid
      FOR UPDATE
    ),
    inserted_salida AS (
      INSERT INTO salidas (producto_id, bodega_origen_id, modulo_destino_id, cantidad, observaciones, usuario_id)
      SELECT ${validated.productoId}::uuid, ${validated.bodegaOrigenId}::uuid, ${validated.moduloDestinoId}::uuid,
             ${validated.cantidad}, ${validated.observaciones ?? null}, ${session.user?.id}::uuid
      FROM stock_row
      WHERE stock_row.cantidad_actual >= ${validated.cantidad}
      RETURNING *
    ),
    update_stock AS (
      UPDATE stock
      SET cantidad_actual = stock.cantidad_actual - ${validated.cantidad}, updated_at = NOW()
      FROM stock_row
      WHERE stock.id = stock_row.id
        AND stock_row.cantidad_actual >= ${validated.cantidad}
    )
    SELECT * FROM inserted_salida
  `;

  if (!salida) {
    // Race condition: entre la lectura previa y el CTE, otro despacho agotó el stock.
    // La guarda cantidad_actual >= cantidad previno la inserción y el decremento.
    return {
      error: `Stock insuficiente. Otro despacho concurrente agotó las unidades. Reintentá.`
    };
  }

  // 3. Upsert stock_modulos (no crítico para atomicidad — valor derivado)
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

  // 4. Activity log
  await db.insert(activityLog).values({
    usuarioId: session.user?.id ?? "",
    accion: "SALIDA_REGISTRADA",
    tablaAfectada: "salidas",
    registroId: salida.id,
    detalle: validated,
  });

  // 5. Guardar bodega como ubicación del producto para futuras salidas
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
  if (!session) return { error: "No autorizado" };

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
  if (!session) return { error: "No autorizado" };

  const s = neon(process.env.DATABASE_URL!);

  // Upsert stock con SQL crudo — REEMPLAZA cantidad_actual, no suma.
  // ON CONFLICT cubre tanto INSERT (nuevo) como UPDATE (existente).
  await s`
    INSERT INTO stock (producto_id, bodega_id, cantidad_actual, updated_at)
    VALUES (${productoId}::uuid, ${bodegaId}::uuid, ${cantidad}, NOW())
    ON CONFLICT (producto_id, bodega_id)
    DO UPDATE SET cantidad_actual = ${cantidad}, updated_at = NOW()
  `;

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
  if (!session) return { error: "No autorizado" };

  const bodega = await db.query.bodegas.findFirst({
    where: eq(bodegas.id, bodegaId)
  });
  if (!bodega) return { error: "Bodega no encontrada" };

  await db.update(productos)
    .set({ ubicacion: bodega.nombre, updatedAt: new Date() })
    .where(eq(productos.id, productoId));

  revalidatePath("/salidas");
  return { ubicacion: bodega.nombre };
}

export async function buscarProductos(query: string) {
  if (!query || query.trim().length < 2) return []

  const corte = await getVisaCorte();
  const search = `%${query.trim()}%`;
  const s = neon(process.env.DATABASE_URL!);

  const rows = await s`
    SELECT p.id, p.codigo, p.knumezet, p.codigo_personal,
           p.descripcion, p.packing, p.ubicacion,
           COALESCE(SUM(st.cantidad_actual), 0)::int AS total_stock
    FROM productos p
    LEFT JOIN stock st ON st.producto_id = p.id
    WHERE (p.codigo ILIKE ${search}
       OR p.descripcion ILIKE ${search}
       OR p.codigo_personal ILIKE ${search}
       OR p.knumezet ILIKE ${search})
      AND (p.knumezet IS NULL
           OR p.knumezet NOT LIKE '%-%-%'
           OR (split_part(p.knumezet, '-', 2)::bigint * 1000000
               + split_part(p.knumezet, '-', 3)::bigint) >= ${corte})
    GROUP BY p.id
    HAVING COALESCE(SUM(st.cantidad_actual), 0) > 0
    ORDER BY p.codigo
    LIMIT 20
  `;

  return rows.map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    knumezet: r.knumezet,
    codigoPersonal: r.codigo_personal,
    descripcion: r.descripcion,
    packing: r.packing,
    ubicacion: r.ubicacion,
    totalStock: r.total_stock,
  }));
}

export async function getStockPorProducto(productoId: string) {
  const s = neon(process.env.DATABASE_URL!);
  const rows = await s`
    SELECT s.bodega_id, s.cantidad_actual, b.nombre AS bodega_nombre
    FROM stock s
    JOIN bodegas b ON b.id = s.bodega_id
    WHERE s.producto_id = ${productoId}::uuid
    ORDER BY b.nombre
  `;
  return rows.map((r: any) => ({
    bodegaId: r.bodega_id as string,
    bodegaNombre: r.bodega_nombre as string,
    cantidadActual: r.cantidad_actual as number,
  }));
}

export async function editarProducto(id: string, data: {
  codigoPersonal?: string;
  descripcion?: string;
  packing?: number;
  observaciones?: string;
  stocks?: { bodegaId: string; cantidadActual: number }[];
}) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };

  const existing = await db.query.productos.findFirst({
    where: eq(productos.id, id),
  });
  if (!existing) return { error: "Producto no encontrado" };

  await db.update(productos).set({
    codigoPersonal: data.codigoPersonal ?? existing.codigoPersonal,
    descripcion: data.descripcion ?? existing.descripcion,
    packing: data.packing ?? existing.packing,
    observaciones: data.observaciones ?? existing.observaciones,
    updatedAt: new Date(),
  }).where(eq(productos.id, id));

  // Update stock por bodega (solo filas existentes, no se crean nuevas)
  if (data.stocks && data.stocks.length > 0) {
    const s = neon(process.env.DATABASE_URL!);
    for (const st of data.stocks) {
      await s`UPDATE stock SET cantidad_actual = ${st.cantidadActual}, updated_at = NOW() WHERE producto_id = ${id}::uuid AND bodega_id = ${st.bodegaId}::uuid`;
    }
  }

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
  if (!session) return { error: "No autorizado" };
  if (session.user?.role !== "admin") return { error: "Solo administradores pueden eliminar productos" };

  // Eliminar dependientes en orden dentro de una transacción atómica
  const s = neon(process.env.DATABASE_URL!);
  const userId = session.user?.id ?? "";

  try {
    await s.transaction([
      s`DELETE FROM activity_log WHERE registro_id = ${id} AND tabla_afectada = 'productos'`,
      s`DELETE FROM producto_imagenes WHERE producto_id = ${id}::uuid`,
      s`DELETE FROM stock_modulos WHERE producto_id = ${id}::uuid`,
      s`DELETE FROM stock WHERE producto_id = ${id}::uuid`,
      s`DELETE FROM entradas WHERE producto_id = ${id}::uuid`,
      s`DELETE FROM salidas WHERE producto_id = ${id}::uuid`,
      s`DELETE FROM traslados WHERE producto_id = ${id}::uuid`,
      s`INSERT INTO activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle) VALUES (${userId}::uuid, 'PRODUCTO_ELIMINADO', 'productos', ${id}, ${JSON.stringify({ id })}::jsonb)`,
      s`DELETE FROM productos WHERE id = ${id}::uuid`,
    ]);

    revalidatePath("/");
    revalidatePath("/entradas");
    revalidatePath("/salidas");
    return { success: true };
  } catch (error: unknown) {
    const e = error instanceof Error ? error : new Error(String(error));
    console.error("[eliminarProducto] Error eliminando producto:", {
      id,
      message: e.message,
      stack: e.stack,
      cause: e.cause,
    });
    return { error: `Error al eliminar el producto: ${e.message}` };
  }
}

export async function eliminarEntrada(entradaId: string) {
  const session = await auth();
  if (!session) return { error: "No autorizado" };
  if (session.user?.role !== "admin")
    return { error: "Solo administradores pueden eliminar entradas" };

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
  if (!session) return { error: "No autorizado" };

  const existing = await db.query.stockModulos.findFirst({
    where: and(
      eq(stockModulos.productoId, productoId),
      eq(stockModulos.moduloId, moduloId)
    ),
  });
  if (!existing) return { error: "Registro no encontrado" };

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
  if (!session) return { error: "No autorizado" };
  if (session.user?.role !== "admin")
    return { error: "Solo administradores pueden eliminar registros de módulo" };

  const existing = await db.query.stockModulos.findFirst({
    where: and(
      eq(stockModulos.productoId, productoId),
      eq(stockModulos.moduloId, moduloId)
    ),
  });
  if (!existing) return { error: "Registro no encontrado" };

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

