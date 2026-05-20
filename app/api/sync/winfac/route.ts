import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Asegurar columna de watermark (año+visación)
  await db.execute(
    `ALTER TABLE sync_winfac_log ADD COLUMN IF NOT EXISTS ultimo_numero_visa BIGINT DEFAULT 0`
  )

  // Leer watermark
  const logResult = await db.execute(
    `SELECT ultimo_numero_visa FROM sync_winfac_log ORDER BY id DESC LIMIT 1`
  )
  const ultimoVisa = Number((logResult.rows[0] as any)?.ultimo_numero_visa) || 0

  // Buscar productos nuevos usando watermark año+numero
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
      ultimo_numero_visa: ultimoVisa,
    })
  }

  // Bulk UPSERT productos nuevos
  await db.execute(
    `INSERT INTO productos (codigo, descripcion, packing, knumezet, created_at, updated_at)
     SELECT codunico, descript, COALESCE(NULLIF(cantcaja,0),1), knumezet, now(), now()
     FROM arjun.inv_sdo
     WHERE (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) > ${ultimoVisa}
     ORDER BY (split_part(knumezet,'-',2)::bigint * 1000000 + split_part(knumezet,'-',3)::bigint) ASC, knumezet ASC
     LIMIT 10
     ON CONFLICT (knumezet) DO UPDATE SET
       codigo = EXCLUDED.codigo,
       descripcion = EXCLUDED.descripcion,
       packing = EXCLUDED.packing,
       updated_at = now()`
  )

  const nuevoVisa = rows[rows.length - 1].visa_key

  // Actualizar watermark
  await db.execute(
    `UPDATE sync_winfac_log SET ultimo_numero_visa = ${nuevoVisa}, ultima_sync_at = now(), productos_creados = productos_creados + ${rows.length} WHERE id = (SELECT id FROM sync_winfac_log ORDER BY id DESC LIMIT 1)`
  )

  return NextResponse.json({
    message: "Sync completado",
    productos_creados: rows.length,
    ultimo_numero_visa: nuevoVisa,
  })
}
