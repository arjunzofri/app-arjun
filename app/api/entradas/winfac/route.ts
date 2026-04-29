import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const nroingreso = searchParams.get("nroingreso")

  if (!nroingreso) {
    return NextResponse.json({ error: "nroingreso requerido" }, { status: 400 })
  }

  const sql = neon(process.env.WINFAC_DB_URL!)

  const productos = await sql`
    SELECT codigo, detalle, nroingreso, cantcaja, costo, saldo, empresa_id
    FROM productos
    WHERE nroingreso = ${nroingreso}
    AND empresa_id IN (2, 20, 218)
    ORDER BY codigo
  `

  return NextResponse.json({ productos })
}
