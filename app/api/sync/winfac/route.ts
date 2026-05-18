import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Asegurar columna de watermark
  await db.execute(
    `ALTER TABLE sync_winfac_log ADD COLUMN IF NOT EXISTS ultima_zeta_procesada TEXT DEFAULT ''`
  )

  // 1. Leer watermark
  const logResult = await db.execute(
    `SELECT ultima_zeta_procesada FROM sync_winfac_log ORDER BY id DESC LIMIT 1`
  )
  const ultimaZeta = (logResult.rows[0] as any)?.ultima_zeta_procesada ?? ''

  // 2. Buscar registros nuevos desde arjun.inv_sdo
  const rows = (await db.execute(
    `SELECT knumezet, codunico, descript, stocdisp, cifunita, cantcaja
     FROM arjun.inv_sdo
     WHERE knumezet > '${ultimaZeta}'
     ORDER BY knumezet
     LIMIT 10`
  )).rows as any[]

  if (rows.length === 0) {
    return NextResponse.json({
      message: "Sin registros nuevos",
      productos_creados: 0,
      ultima_zeta_procesada: ultimaZeta
    })
  }

  // 3. Bulk UPSERT en productos
  await db.execute(
    `INSERT INTO productos (codigo, descripcion, packing, created_at, updated_at)
     SELECT codunico, descript, COALESCE(NULLIF(cantcaja,0),1), now(), now()
     FROM arjun.inv_sdo
     WHERE knumezet > '${ultimaZeta}'
     ORDER BY knumezet
     LIMIT 10
     ON CONFLICT (codigo) DO UPDATE SET
       descripcion = EXCLUDED.descripcion,
       packing = EXCLUDED.packing,
       updated_at = now()`
  )

  const nuevaUltimaZeta = rows[rows.length - 1].knumezet

  // 4. Actualizar watermark
  await db.execute(
    `UPDATE sync_winfac_log SET ultima_zeta_procesada = '${nuevaUltimaZeta}', ultima_sync_at = now(), productos_creados = productos_creados + ${rows.length} WHERE id = (SELECT id FROM sync_winfac_log ORDER BY id DESC LIMIT 1)`
  )

  return NextResponse.json({
    message: "Sync completado",
    productos_creados: rows.length,
    ultima_zeta_procesada: nuevaUltimaZeta,
  })
}
