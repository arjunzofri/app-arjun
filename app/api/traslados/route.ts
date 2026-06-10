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

    // Transacción atómica con guarda en WHERE: evita TOCTOU entre verificación y escritura
    await s.transaction([
      s`
        DO $$
        DECLARE
          _affected int;
        BEGIN
          UPDATE public.stock
          SET cantidad_actual = cantidad_actual - ${cant},
              updated_at = NOW()
          WHERE producto_id = ${productoId}::uuid
            AND bodega_id = ${bodegaOrigenId}::uuid
            AND cantidad_actual >= ${cant};

          GET DIAGNOSTICS _affected = ROW_COUNT;

          IF _affected = 0 THEN
            RAISE EXCEPTION 'Stock insuficiente' USING ERRCODE = 'P0001';
          END IF;

          INSERT INTO public.stock (producto_id, bodega_id, cantidad_actual)
          VALUES (${productoId}::uuid, ${bodegaDestinoId}::uuid, ${cant})
          ON CONFLICT (producto_id, bodega_id)
          DO UPDATE SET cantidad_actual = public.stock.cantidad_actual + ${cant},
                        updated_at = NOW();

          INSERT INTO public.traslados (producto_id, bodega_origen_id, bodega_destino_id, cantidad, usuario_id, observaciones)
          VALUES (${productoId}::uuid, ${bodegaOrigenId}::uuid, ${bodegaDestinoId}::uuid, ${cant}, ${session.user.id}::uuid, ${observaciones ?? null});
        END $$;
      `
    ]);

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes("Stock insuficiente")) {
      return NextResponse.json(
        { error: `Stock insuficiente` },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error al procesar el traslado" },
      { status: 500 }
    )
  }
}
