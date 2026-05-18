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
    return NextResponse.json({ error: "Parámetro q requerido (NV o zeta)" }, { status: 400 })
  }

  // Detectar si es NV (solo dígitos, máx 6) o zeta
  const esNV = /^\d{1,6}$/.test(query)
  const knumfoli = esNV ? query.padStart(6, '0') : null

  let encabezado: Encabezado | null = null
  let productos: any[] = []

  if (esNV) {
    // Buscar por factura = knumfoli
    let result = await db.execute(
      `SELECT zeta, codigo, descrip, saldo, cif, costo, cancaja, factura, fechaing
       FROM arjun.inv
       WHERE factura = '${knumfoli}'
       ORDER BY codigo`
    )

    if (result.rows.length === 0) {
      // Fallback: buscar por nro_dsm
      result = await db.execute(
        `SELECT zeta, codigo, descrip, saldo, cif, costo, cancaja, factura, fechaing
         FROM arjun.inv
         WHERE nro_dsm = '${knumfoli}'
         ORDER BY codigo`
      )
    }

    if (result.rows.length > 0) {
      const rows = result.rows as any[]
      encabezado = {
        knumfoli: knumfoli!,
        visaadua: null,
        fechanvt: rows[0].fechaing,
        val_doc: null,
        canbulto: null,
        cliente: null,
      }
      productos = rows.map((r) => ({
        codigo: r.codigo,
        detalle: r.descrip,
        cantcaja: r.cancaja,
        costo: r.cif,
        saldo: r.saldo,
      }))
    }
  } else {
    // Buscar por zeta
    const result = await db.execute(
      `SELECT zeta, codigo, descrip, saldo, cif, costo, cancaja, factura, fechaing
       FROM arjun.inv
       WHERE zeta = '${query}'
       ORDER BY codigo`
    )

    if (result.rows.length > 0) {
      const rows = result.rows as any[]
      encabezado = {
        knumfoli: rows[0].factura,
        visaadua: null,
        fechanvt: rows[0].fechaing,
        val_doc: null,
        canbulto: null,
        cliente: null,
      }
      productos = rows.map((r) => ({
        codigo: r.codigo,
        detalle: r.descrip,
        cantcaja: r.cancaja,
        costo: r.cif,
        saldo: r.saldo,
      }))
    }
  }

  if (!encabezado) {
    return NextResponse.json({ error: "No se encontró la Nota de Venta" }, { status: 404 })
  }

  return NextResponse.json({ encabezado, productos })
}
