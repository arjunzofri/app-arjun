import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const result = await db.execute(
    `INSERT INTO productos (codigo, descripcion, packing, created_at, updated_at)
     SELECT codunico, descript, COALESCE(NULLIF(cantcaja,0),1), now(), now()
     FROM arjun.inv_sdo
     ON CONFLICT (codigo) DO UPDATE SET
       descripcion = EXCLUDED.descripcion,
       packing = EXCLUDED.packing,
       updated_at = now()
     RETURNING codigo`
  )

  return NextResponse.json({ productos_creados: result.rows.length })
}
