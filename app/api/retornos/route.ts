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

  const { productoId, moduloOrigenId, bodegaDestinoId, cantidad, observaciones } = body

  // Validaciones
  if (!productoId || !moduloOrigenId || !bodegaDestinoId || !cantidad) {
    return NextResponse.json(
      { error: "Faltan campos requeridos: productoId, moduloOrigenId, bodegaDestinoId, cantidad" },
      { status: 400 }
    )
  }

  const cant = Number(cantidad)
  if (isNaN(cant) || cant <= 0) {
    return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // CTE atómica: rebaja stock_modulos → upsert stock bodega destino → insert retorno.
    // Si el UPDATE no afecta ninguna fila (stock insuficiente), los CTE siguientes
    // no ejecutan inserciones y el RETURNING final devuelve 0 filas.
    const result = await sql`
      WITH rebaja AS (
        UPDATE public.stock_modulos
        SET cantidad_acumulada = cantidad_acumulada - ${cant},
            updated_at = NOW()
        WHERE producto_id = ${productoId}::uuid
          AND modulo_id = ${moduloOrigenId}::uuid
          AND cantidad_acumulada >= ${cant}
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
      INSERT INTO public.retornos (producto_id, modulo_origen_id, bodega_destino_id, cantidad, usuario_id, observaciones)
      SELECT ${productoId}::uuid, ${moduloOrigenId}::uuid, ${bodegaDestinoId}::uuid,
             ${cant}, ${session.user.id}::uuid, ${observaciones ?? null}
      WHERE EXISTS (SELECT 1 FROM rebaja)
      RETURNING 1 AS ok
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Stock insuficiente en el módulo" },
        { status: 400 }
      )
    }

    // Activity log
    await sql`
      INSERT INTO public.activity_log (usuario_id, accion, tabla_afectada, registro_id, detalle)
      VALUES (${session.user.id}::uuid, 'RETORNO_REGISTRADO', 'retornos', ${productoId}::uuid,
              ${JSON.stringify({ productoId, moduloOrigenId, bodegaDestinoId, cantidad: cant, observaciones })}::jsonb)
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error en retorno:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: "Error al procesar el retorno" },
      { status: 500 }
    )
  }
}
