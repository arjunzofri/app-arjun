import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/lib/auth"

type Encabezado = {
  knumfoli: string
  visaadua: string
  fechanvt: string
  val_doc: number
  canbulto: number
  cliente: string
  kcodclie: number
  empresa: 'vida' | 'sanjh'
}

const KCODCLIE_ARJUN = [2, 20, 173, 218]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.trim()

  if (!query) {
    return NextResponse.json({ error: "Parámetro q requerido (NV o visación)" }, { status: 400 })
  }

  const sql = neon(process.env.WINFAC_DB_URL!)

  // Detectar si es NV (solo dígitos, máx 6) o visación
  const esNV = /^\d{1,6}$/.test(query)
  const knumfoli = esNV ? query.padStart(6, '0') : null
  const visacion = !esNV ? query : null

  // Buscar en vida y sanjh
  let encabezado: Encabezado | null = null

  if (esNV) {
    const [vida] = await sql`
      SELECT knumfoli, visaadua, fechanvt, val_doc, canbulto, cliente, kcodclie
      FROM vida.movidcto
      WHERE knumfoli = ${knumfoli}
      AND kcodclie = ANY(${KCODCLIE_ARJUN})
      LIMIT 1
    `
    if (vida) {
      encabezado = { ...vida, empresa: 'vida' } as Encabezado
    } else {
      const [sanjh] = await sql`
        SELECT knumfoli, visaadua, fechanvt, val_doc, canbulto, cliente, kcodclie
        FROM sanjh.movidcto
        WHERE knumfoli = ${knumfoli}
        AND kcodclie = ANY(${KCODCLIE_ARJUN})
        LIMIT 1
      `
      if (sanjh) encabezado = { ...sanjh, empresa: 'sanjh' } as Encabezado
    }
  } else {
    const [vida] = await sql`
      SELECT knumfoli, visaadua, fechanvt, val_doc, canbulto, cliente, kcodclie
      FROM vida.movidcto
      WHERE visaadua = ${visacion}
      AND kcodclie = ANY(${KCODCLIE_ARJUN})
      LIMIT 1
    `
    if (vida) {
      encabezado = { ...vida, empresa: 'vida' } as Encabezado
    } else {
      const [sanjh] = await sql`
        SELECT knumfoli, visaadua, fechanvt, val_doc, canbulto, cliente, kcodclie
        FROM sanjh.movidcto
        WHERE visaadua = ${visacion}
        AND kcodclie = ANY(${KCODCLIE_ARJUN})
        LIMIT 1
      `
      if (sanjh) encabezado = { ...sanjh, empresa: 'sanjh' } as Encabezado
    }
  }

  if (!encabezado) {
    return NextResponse.json({ error: "No se encontró la Nota de Venta" }, { status: 404 })
  }

  // Obtener productos según empresa
  const schema = encabezado.empresa === 'vida' ? 'vida' : 'sanjh'
  
  let productos = []
  if (schema === 'vida') {
    productos = await sql`
      SELECT DISTINCT ON (p.codigo)
        i.codunico as codigo,
        p.detalle,
        p.cantcaja,
        p.costo,
        p.saldo,
        i.knumezet as nroingreso
      FROM vida.itemdcto i
      JOIN public.productos p ON p.nroingreso = i.knumezet
      WHERE i.knumfoli = ${encabezado.knumfoli}
      AND p.empresa_id = 2
      ORDER BY p.codigo, p.nroingreso
    `
  } else {
    productos = await sql`
      SELECT DISTINCT ON (p.codigo)
        i.codunico as codigo,
        p.detalle,
        p.cantcaja,
        p.costo,
        p.saldo,
        i.knumezet as nroingreso
      FROM sanjh.itemdcto i
      JOIN public.productos p ON p.nroingreso = i.knumezet
      WHERE i.knumfoli = ${encabezado.knumfoli}
      AND p.empresa_id = 1
      ORDER BY p.codigo, p.nroingreso
    `
  }

  return NextResponse.json({ encabezado, productos })
}
