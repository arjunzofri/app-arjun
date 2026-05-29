import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { productoId, bodegaOrigenId, bodegaDestinoId, cantidad, observaciones } = body

  // Validaciones
  if (!productoId || !bodegaOrigenId || !bodegaDestinoId || !cantidad) {
    return NextResponse.json({ error: "Faltan campos requeridos: productoId, bodegaOrigenId, bodegaDestinoId, cantidad" }, { status: 400 })
  }

  const cant = Number(cantidad)
  if (isNaN(cant) || cant <= 0) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 })
  }

  if (bodegaOrigenId === bodegaDestinoId) {
    return NextResponse.json({ error: "La bodega origen y destino no pueden ser la misma" }, { status: 400 })
  }

  try {
    const s = neon(process.env.DATABASE_URL!)

    // Verificar stock suficiente en origen
    const [stockRow] = await s`
      SELECT cantidad_actual
      FROM public.stock
      WHERE producto_id = ${productoId}::uuid
        AND bodega_id = ${bodegaOrigenId}::uuid
    `

    const stockActual = Number(stockRow?.cantidad_actual ?? 0)
    if (stockActual < cant) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${stockActual}, solicitado: ${cant}` },
        { status: 400 }
      )
    }

    // Transacción: restar origen, sumar destino, registrar traslado
    const [traslado] = await s.transaction([
      s`UPDATE public.stock
         SET cantidad_actual = cantidad_actual - ${cant},
             updated_at = NOW()
         WHERE producto_id = ${productoId}::uuid
           AND bodega_id = ${bodegaOrigenId}::uuid`,

      s`INSERT INTO public.stock (producto_id, bodega_id, cantidad_actual)
         VALUES (${productoId}::uuid, ${bodegaDestinoId}::uuid, ${cant})
         ON CONFLICT (producto_id, bodega_id)
         DO UPDATE SET cantidad_actual = public.stock.cantidad_actual + ${cant},
                       updated_at = NOW()`,

      s`INSERT INTO public.traslados (producto_id, bodega_origen_id, bodega_destino_id, cantidad, usuario_id, observaciones)
         VALUES (${productoId}::uuid, ${bodegaOrigenId}::uuid, ${bodegaDestinoId}::uuid, ${cant}, ${session.user.id}::uuid, ${observaciones ?? null})
         RETURNING *`,
    ])

    return NextResponse.json({ ok: true, traslado })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al procesar el traslado" },
      { status: 500 }
    )
  }
}
