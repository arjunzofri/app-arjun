import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { getBodegaPorVendedor } from "@/lib/utils/get-bodega-por-vendedor"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const desde = Number(req.nextUrl.searchParams.get("desde"))
  const hasta = Number(req.nextUrl.searchParams.get("hasta"))
  if (!desde || !hasta || desde > hasta) {
    return NextResponse.json(
      { error: "Query params requeridos: ?desde=NUM&hasta=NUM (desde <= hasta)" },
      { status: 400 }
    )
  }

  // Asegurar schema
  await db.execute(
    `ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS origen_winfac BOOLEAN DEFAULT false`
  )
  await db.execute(`
    DO $$
    BEGIN
      ALTER TYPE origen ADD VALUE 'winfac_futuro';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Buscar TODOS los registros en el rango (sin LIMIT)
  const rows = (await db.execute(
    `SELECT knumezet, codunico, descript, stocdisp, cifunita, cantcaja, vendedor_rut,
            (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) as visa_key
     FROM arjun.inv_sdo
     WHERE (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) >= ${desde}
       AND (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) <= ${hasta}
     ORDER BY visa_key ASC, knumezet ASC`
  )).rows as any[]

  if (rows.length === 0) {
    return NextResponse.json({
      procesados: 0,
      creados: 0,
      actualizados: 0,
      ignorados: 0,
      detalle: [],
    })
  }

  // Obtener IDs de ambas bodegas y admin user
  const bodegasResult = await db.execute(
    `SELECT id, nombre FROM bodegas WHERE nombre IN ('Bodega 1 Vida Digital', 'Bodega Arjun')`
  )
  const bodegaMap: Record<string, string> = {}
  for (const b of bodegasResult.rows as any[]) {
    bodegaMap[b.nombre] = b.id
  }
  const BODEGA_VIDA_DIGITAL_1 = bodegaMap["Bodega 1 Vida Digital"]
  const BODEGA_ARJUN = bodegaMap["Bodega Arjun"]

  const adminResult = await db.execute(
    `SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1`
  )
  const adminId = (adminResult.rows[0] as any)?.id

  let creados = 0
  let actualizados = 0
  let ignorados = 0
  const detalle: Array<{ knumezet: string; accion: string; razon: string }> = []

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
        const vendedorRut: string | null = row.vendedor_rut ?? null
        const bodegaId = getBodegaPorVendedor(vendedorRut)

        if (!bodegaId || !adminId) {
          detalle.push({ knumezet, accion: "ignorado", razon: "falta bodega o admin user" })
          ignorados++
          continue
        }
        const insertResult = await db.execute(
          `INSERT INTO productos (codigo, descripcion, packing, knumezet, origen_winfac, created_at, updated_at)
           VALUES ('${codunico.replace(/'/g, "''")}', '${descEscaped}', ${packing}, '${knumEscaped}', true, now(), now())
           RETURNING id`
        )
        const productoId = (insertResult.rows[0] as any)?.id
        if (!productoId) {
          detalle.push({ knumezet, accion: "ignorado", razon: "fallo INSERT productos" })
          ignorados++
          continue
        }

        // Stock en la bodega determinada por vendedor_rut
        const stockRow = await db.execute(
          `SELECT id FROM stock WHERE producto_id = '${productoId}' AND bodega_id = '${bodegaId}' LIMIT 1`
        )
        if ((stockRow.rows[0] as any)?.id) {
          await db.execute(
            `UPDATE stock SET cantidad_actual = ${stocdispNum}, updated_at = now()
             WHERE producto_id = '${productoId}' AND bodega_id = '${bodegaId}'`
          )
        } else {
          await db.execute(
            `INSERT INTO stock (producto_id, bodega_id, cantidad_actual)
             VALUES ('${productoId}', '${bodegaId}', ${stocdispNum})`
          )
        }

        // Entrada
        await db.execute(
          `INSERT INTO entradas (producto_id, bodega_id, cantidad, usuario_id, origen)
           VALUES ('${productoId}', '${bodegaId}', ${stocdispNum}, '${adminId}', 'winfac_futuro')`
        )

        // Activity log
        const logDetalle = JSON.stringify({ knumezet, stocdisp: stocdispNum, accion: "producto_nuevo_reprocesado" })
        await db.execute(
          `INSERT INTO activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle)
           VALUES ('${adminId}', 'reprocesar_sync', 'productos', '${productoId}', '${logDetalle.replace(/'/g, "''")}')`
        )

        creados++
        detalle.push({ knumezet, accion: "creado", razon: `producto nuevo, stock inicial=${stocdispNum}` })
      } else {
        // === PRODUCTO EXISTENTE ===
        const productoId: string = prod.id
        const ubicacion: string | null = prod.ubicacion
        let bodegaId = BODEGA_ARJUN
        if (ubicacion) {
          const bodegaRes = await db.execute(
            `SELECT id FROM bodegas WHERE nombre = '${ubicacion.replace(/'/g, "''")}' LIMIT 1`
          )
          bodegaId = (bodegaRes.rows[0] as any)?.id || BODEGA_ARJUN
        }
        if (!bodegaId || !adminId) {
          detalle.push({ knumezet, accion: "ignorado", razon: `falta bodega (ubicacion=${ubicacion}) o admin` })
          ignorados++
          continue
        }

        // Sumar entradas previas de winfac_futuro
        const sumaResult = await db.execute(
          `SELECT COALESCE(SUM(cantidad), 0) as total
           FROM entradas
           WHERE producto_id = '${productoId}' AND origen IN ('winfac', 'winfac_futuro')`
        )
        const totalPrevio = Number((sumaResult.rows[0] as any)?.total) || 0
        const delta = stocdispNum - totalPrevio

        if (delta <= 0) {
          detalle.push({ knumezet, accion: "ignorado", razon: `delta=${delta} <= 0 (stocdisp=${stocdispNum}, previo=${totalPrevio})` })
          ignorados++
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
        const logDetalle = JSON.stringify({
          knumezet,
          delta,
          stocdisp: stocdispNum,
          totalPrevio,
          accion: "stock_actualizado_reprocesado",
        })
        await db.execute(
          `INSERT INTO activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle)
           VALUES ('${adminId}', 'reprocesar_sync', 'stock', '${productoId}', '${logDetalle.replace(/'/g, "''")}')`
        )

        actualizados++
        detalle.push({ knumezet, accion: "actualizado", razon: `delta=${delta} (stocdisp=${stocdispNum}, previo=${totalPrevio})` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("Reprocesar Sync: error procesando fila", row?.knumezet, msg)
      detalle.push({ knumezet: row?.knumezet ?? "desconocido", accion: "ignorado", razon: `error: ${msg}` })
      ignorados++
    }
  }

  return NextResponse.json({
    procesados: rows.length,
    creados,
    actualizados,
    ignorados,
    detalle,
  })
}
