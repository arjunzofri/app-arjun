import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/lib/auth"

type Encabezado = {
  knumfoli: string
  visaadua: string | null
  fechanvt: string
  val_doc: number | null
  canbulto: number | null
  cliente: string | null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.trim()

  if (!query) {
    return NextResponse.json({ error: "Parámetro q requerido (visación)" }, { status: 400 })
  }

  // Buscar visación en arjun.inv_sdo
  const sql = neon(process.env.DATABASE_URL!)
  const likeParam = `%${query}%`
  const rows = await sql`
    SELECT knumezet, codunico, descript, stocdisp, cifunita, cantcaja
    FROM arjun.inv_sdo
    WHERE knumezet LIKE ${likeParam}
    ORDER BY knumezet
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: "No se encontró la visación" }, { status: 404 })
  }

  const encabezado: Encabezado = {
    knumfoli: query,
    visaadua: query,
    fechanvt: null as any,
    val_doc: null,
    canbulto: null,
    cliente: null,
  }

  const productos = rows.map((r) => ({
    codigo: r.codunico,
    detalle: r.descript,
    cantcaja: r.cantcaja,
    costo: r.cifunita,
    saldo: r.stocdisp,
  }))

  return NextResponse.json({ encabezado, productos })
}
