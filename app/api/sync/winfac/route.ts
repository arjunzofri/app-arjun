import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Asegurar schema
  await db.execute(
    `ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS origen_winfac BOOLEAN DEFAULT false`
  )
  await db.execute(
    `ALTER TABLE sync_winfac_log ADD COLUMN IF NOT EXISTS ultimo_numero_visa BIGINT DEFAULT 0`
  )
  await db.execute(`
    DO $$
    BEGIN
      ALTER TYPE origen ADD VALUE 'winfac_futuro';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Leer watermark
  const logResult = await db.execute(
    `SELECT ultimo_numero_visa FROM sync_winfac_log ORDER BY id DESC LIMIT 1`
  )
  const ultimoVisa = Number((logResult.rows[0] as any)?.ultimo_numero_visa) || 0

  // Buscar productos nuevos
  const rows = (await db.execute(
    `SELECT knumezet, codunico, descript, stocdisp, cifunita, cantcaja,
            (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) as visa_key
     FROM arjun.inv_sdo
     WHERE (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) > ${ultimoVisa}
     ORDER BY visa_key ASC, knumezet ASC
     LIMIT 10`
  )).rows as any[]

  if (rows.length === 0) {
    return NextResponse.json({
      message: "Sin productos nuevos",
      productos_creados: 0,
      productos_actualizados: 0,
      ultimo_numero_visa: ultimoVisa,
      debug: {
        registros_encontrados: 0,
        watermark_anterior: ultimoVisa,
        watermark_nuevo: ultimoVisa,
        detalle: [],
      },
    })
  }

  // Obtener Bodega Arjun y admin user
  const bodegaResult = await db.execute(
    `SELECT id FROM bodegas WHERE nombre = 'Bodega Arjun' LIMIT 1`
  )
  const bodegaArjunId = (bodegaResult.rows[0] as any)?.id

  const adminResult = await db.execute(
    `SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1`
  )
  const adminId = (adminResult.rows[0] as any)?.id

  let creados = 0
  let actualizados = 0
  const debugDetalle: Array<{ knumezet: string; accion: string; razon: string }> = []

  for (const row of rows) {
    try {
      const knumezet: string = row.knumezet
      const codunico: string = row.codunico
      const descript: string = row.descript
      const stocdispNum = Number(row.stocdisp) || 0
      const packing = Number(row.cantcaja) || 1
      const descEscaped = (descript || "").replace(/'/g, "''")
      const knumEscaped = knumezet.replace(/'/g, "''")

      // Verificar si el producto ya existe
      const existente = await db.execute(
        `SELECT id, ubicacion FROM productos WHERE knumezet = '${knumEscaped}' LIMIT 1`
      )
      const prod = existente.rows[0] as any

      if (!prod) {
        // === PRODUCTO NUEVO ===
        if (!bodegaArjunId || !adminId) {
          debugDetalle.push({ knumezet, accion: "ignorado", razon: "falta Bodega Arjun o admin user" })
          continue
        }
        const insertResult = await db.execute(
          `INSERT INTO productos (codigo, descripcion, packing, knumezet, origen_winfac, created_at, updated_at)
           VALUES ('${codunico.replace(/'/g, "''")}', '${descEscaped}', ${packing}, '${knumEscaped}', true, now(), now())
           RETURNING id`
        )
        const productoId = (insertResult.rows[0] as any)?.id
        if (!productoId) {
          debugDetalle.push({ knumezet, accion: "ignorado", razon: "fallo INSERT productos" })
          continue
        }

        // Stock en Bodega Arjun
        const stockRow = await db.execute(
          `SELECT id FROM stock WHERE producto_id = '${productoId}' AND bodega_id = '${bodegaArjunId}' LIMIT 1`
        )
        if ((stockRow.rows[0] as any)?.id) {
          await db.execute(
            `UPDATE stock SET cantidad_actual = ${stocdispNum}, updated_at = now()
             WHERE producto_id = '${productoId}' AND bodega_id = '${bodegaArjunId}'`
          )
        } else {
          await db.execute(
            `INSERT INTO stock (producto_id, bodega_id, cantidad_actual)
             VALUES ('${productoId}', '${bodegaArjunId}', ${stocdispNum})`
          )
        }

        // Entrada
        await db.execute(
          `INSERT INTO entradas (producto_id, bodega_id, cantidad, usuario_id, origen)
           VALUES ('${productoId}', '${bodegaArjunId}', ${stocdispNum}, '${adminId}', 'winfac_futuro')`
        )

        // Activity log
        const detalle = JSON.stringify({ knumezet, stocdisp: stocdispNum, accion: "producto_nuevo" })
        await db.execute(
          `INSERT INTO activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle)
           VALUES ('${adminId}', 'sync_winfac', 'productos', '${productoId}', '${detalle.replace(/'/g, "''")}')`
        )

        creados++
        debugDetalle.push({ knumezet, accion: "creado", razon: `producto nuevo, stock inicial=${stocdispNum}` })
      } else {
        // === PRODUCTO EXISTENTE ===
        const productoId: string = prod.id
        const ubicacion: string | null = prod.ubicacion
        const bodegaId = ubicacion || bodegaArjunId
        if (!bodegaId || !adminId) {
          debugDetalle.push({ knumezet, accion: "ignorado", razon: `falta bodega (ubicacion=${ubicacion}) o admin` })
          continue
        }

        // Sumar entradas previas de winfac_futuro para este producto
        const sumaResult = await db.execute(
          `SELECT COALESCE(SUM(cantidad), 0) as total
           FROM entradas
           WHERE producto_id = '${productoId}' AND origen = 'winfac_futuro'`
        )
        const totalPrevio = Number((sumaResult.rows[0] as any)?.total) || 0
        const delta = stocdispNum - totalPrevio

        if (delta <= 0) {
          debugDetalle.push({ knumezet, accion: "ignorado", razon: `delta=${delta} <= 0 (stocdisp=${stocdispNum}, previo=${totalPrevio})` })
          continue
        }

        // Stock
        const stockRow = await db.execute(
          `SELECT id FROM stock WHERE producto_id = '${productoId}' AND bodega_id = '${bodegaId}' LIMIT 1`
        )
        if ((stockRow.rows[0] as any)?.id) {
          await db.execute(
            `UPDATE stock SET cantidad_actual = cantidad_actual + ${delta}, updated_at = now()
             WHERE producto_id = '${productoId}' AND bodega_id = '${bodegaId}'`
          )
        } else {
          await db.execute(
            `INSERT INTO stock (producto_id, bodega_id, cantidad_actual)
             VALUES ('${productoId}', '${bodegaId}', ${delta})`
          )
        }

        // Entrada con el delta
        await db.execute(
          `INSERT INTO entradas (producto_id, bodega_id, cantidad, usuario_id, origen)
           VALUES ('${productoId}', '${bodegaId}', ${delta}, '${adminId}', 'winfac_futuro')`
        )

        // Activity log
        const detalle = JSON.stringify({
          knumezet,
          delta,
          stocdisp: stocdispNum,
          totalPrevio,
          accion: "stock_actualizado",
        })
        await db.execute(
          `INSERT INTO activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle)
           VALUES ('${adminId}', 'sync_winfac', 'stock', '${productoId}', '${detalle.replace(/'/g, "''")}')`
        )

        actualizados++
        debugDetalle.push({ knumezet, accion: "actualizado", razon: `delta=${delta} (stocdisp=${stocdispNum}, previo=${totalPrevio})` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("Sync WinFac: error procesando fila", row?.knumezet, msg)
      debugDetalle.push({ knumezet: row?.knumezet ?? "desconocido", accion: "ignorado", razon: `error: ${msg}` })
      continue
    }
  }

  const nuevoVisa = rows[rows.length - 1].visa_key

  // Actualizar watermark
  const totalProcesados = creados + actualizados
  await db.execute(
    `UPDATE sync_winfac_log SET ultimo_numero_visa = ${nuevoVisa}, ultima_sync_at = now(), productos_creados = productos_creados + ${totalProcesados} WHERE id = (SELECT id FROM sync_winfac_log ORDER BY id DESC LIMIT 1)`
  )

  return NextResponse.json({
    message: "Sync completado",
    productos_creados: creados,
    productos_actualizados: actualizados,
    ultimo_numero_visa: nuevoVisa,
    debug: {
      registros_encontrados: rows.length,
      watermark_anterior: ultimoVisa,
      watermark_nuevo: nuevoVisa,
      detalle: debugDetalle,
    },
  })
}
