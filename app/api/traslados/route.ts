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
    const sql = neon(process.env.DATABASE_URL!)

    // CTE encadenada: UPDATE atómico con guarda → UPSERT destino → INSERT traslado.
    // Si el UPDATE no afecta ninguna fila (stock insuficiente o fila inexistente),
    // los CTEs siguientes no ejecutan inserciones y el RETURNING final devuelve 0 filas.
    // Sin PL/pgSQL — compatible con Neon HTTP driver.
    const result = await sql`
      WITH rebaja AS (
        UPDATE public.stock
        SET cantidad_actual = cantidad_actual - ${cant},
            updated_at = NOW()
        WHERE producto_id = ${productoId}::uuid
          AND bodega_id = ${bodegaOrigenId}::uuid
          AND cantidad_actual >= ${cant}
        RETURNING 1 AS done
      ),
      destino AS (
        INSERT INTO public.stock (producto_id, bodega_id, cantidad_actual)
        SELECT ${productoId}::uuid, ${bodegaDestinoId}::uuid, ${cant}
        WHERE EXISTS (SELECT 1 FROM rebaja)
        ON CONFLICT (producto_id, bodega_id)
        DO UPDATE SET cantidad_actual = public.stock.cantidad_actual + ${cant},
                      updated_at = NOW()
      )
      INSERT INTO public.traslados (producto_id, bodega_origen_id, bodega_destino_id, cantidad, usuario_id, observaciones)
      SELECT ${productoId}::uuid, ${bodegaOrigenId}::uuid, ${bodegaDestinoId}::uuid, ${cant}, ${session.user.id}::uuid, ${observaciones ?? null}
      WHERE EXISTS (SELECT 1 FROM rebaja)
      RETURNING 1 AS ok
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Stock insuficiente" },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error en traslado:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: "Error al procesar el traslado" },
      { status: 500 }
    )
  }
}
