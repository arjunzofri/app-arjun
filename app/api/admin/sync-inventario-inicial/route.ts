import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Operación 1 — UPSERT productos agrupando duplicados por codunico
  const prodResult = await db.execute(
    `INSERT INTO productos (codigo, descripcion, packing, created_at, updated_at)
     SELECT
       codunico,
       MAX(descript),
       COALESCE(NULLIF(MAX(cantcaja),0),1),
       now(),
       now()
     FROM arjun.inv_sdo
     GROUP BY codunico
     ON CONFLICT (codigo) DO UPDATE SET
       descripcion = EXCLUDED.descripcion,
       packing = EXCLUDED.packing,
       updated_at = now()
     RETURNING codigo`
  )

  // Operación 2 — UPSERT stock sumando saldos en Bodega Arjun
  const bodegaResult = await db.execute(
    `SELECT id FROM bodegas WHERE nombre = 'Bodega Arjun' LIMIT 1`
  )
  const bodegaArjunId = (bodegaResult.rows[0] as any)?.id

  let stockActualizado = 0
  if (bodegaArjunId) {
    const stockResult = await db.execute(
      `INSERT INTO stock (producto_id, bodega_id, cantidad_actual, updated_at)
       SELECT p.id, '${bodegaArjunId}', SUM(i.stocdisp), now()
       FROM arjun.inv_sdo i
       JOIN productos p ON p.codigo = i.codunico
       GROUP BY p.id
       ON CONFLICT (producto_id, bodega_id) DO UPDATE SET
         cantidad_actual = EXCLUDED.cantidad_actual,
         updated_at = now()
       RETURNING id`
    )
    stockActualizado = stockResult.rows.length
  }

  return NextResponse.json({
    productos_creados: prodResult.rows.length,
    stock_actualizado: stockActualizado,
  })
}
