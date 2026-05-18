import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
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
  const result = await db.execute(
    `SELECT knumezet, codunico, descript, stocdisp, cifunita, cantcaja
     FROM arjun.inv_sdo
     WHERE knumezet LIKE '%' || '${query}' || '%'
     ORDER BY knumezet`
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "No se encontró la visación" }, { status: 404 })
  }

  const rows = result.rows as any[]

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
