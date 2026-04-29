import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { db } from "@/db"
import { productos, entradas, notasVenta, activityLog } from "@/db/schema"
import { eq } from "drizzle-orm"

const KCODCLIE_ARJUN = [2, 20, 218]

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const winfac = neon(process.env.WINFAC_DB_URL!)

  // 1. Leer watermark
  const logResult = await db.execute(
    `SELECT ultima_nv_procesada FROM sync_winfac_log ORDER BY id DESC LIMIT 1`
  )
  const ultimaNV = (logResult.rows[0] as any)?.ultima_nv_procesada ?? '000000'

  // 2. Buscar NV nuevas con visación confirmada en vida y sanjh
  const nvsVida = await winfac`
    SELECT knumfoli, visaadua, fechanvt, val_doc, canbulto, cliente
    FROM vida.movidcto
    WHERE kcodclie = ANY(${KCODCLIE_ARJUN})
    AND visaadua IS NOT NULL
    AND knumfoli > ${ultimaNV}
    ORDER BY knumfoli ASC
    LIMIT 5
  `

  const nvsSanjh = await winfac`
    SELECT knumfoli, visaadua, fechanvt, val_doc, canbulto, cliente
    FROM sanjh.movidcto
    WHERE kcodclie = ANY(${KCODCLIE_ARJUN})
    AND visaadua IS NOT NULL
    AND knumfoli > ${ultimaNV}
    ORDER BY knumfoli ASC
    LIMIT 5
  `

  const todasNVs = [...nvsVida.map((r: any) => ({ ...r, empresa: 'vida' })), 
                    ...nvsSanjh.map((r: any) => ({ ...r, empresa: 'sanjh' }))]
    .sort((a, b) => a.knumfoli.localeCompare(b.knumfoli))

  if (todasNVs.length === 0) {
    return NextResponse.json({ 
      message: "Sin NV nuevas", 
      nvs_importadas: 0, 
      productos_creados: 0,
      ultima_nv_procesada: ultimaNV
    })
  }

  let nvsImportadas = 0
  let productosCreados = 0
  let nuevaUltimaNV = ultimaNV

  for (const nv of todasNVs) {
    try {
      // 3. Obtener productos de la NV
      const items = nv.empresa === 'vida'
        ? await winfac`
            SELECT DISTINCT ON (p.codigo)
              i.codunico as codigo,
              p.detalle,
              p.cantcaja,
              p.costo,
              p.saldo,
              i.knumezet as nroingreso
            FROM vida.itemdcto i
            JOIN public.productos p ON p.nroingreso = i.knumezet
            WHERE i.knumfoli = ${nv.knumfoli}
            AND p.empresa_id = 2
            ORDER BY p.codigo, p.nroingreso
          `
        : await winfac`
            SELECT DISTINCT ON (p.codigo)
              i.codunico as codigo,
              p.detalle,
              p.cantcaja,
              p.costo,
              p.saldo,
              i.knumezet as nroingreso
            FROM sanjh.itemdcto i
            JOIN public.productos p ON p.nroingreso = i.knumezet
            WHERE i.knumfoli = ${nv.knumfoli}
            AND p.empresa_id = 1
            ORDER BY p.codigo, p.nroingreso
          `

      if (items.length === 0) {
        nuevaUltimaNV = nv.knumfoli
        continue
      }

      // 4. Registrar NV en App Arjun
      const nvRows = await db.execute(
        `INSERT INTO notas_venta (numero_nv, proveedor, fecha_compra)
   VALUES ('${nv.knumfoli}', 'vida_digital', '${nv.fechanvt}')
   ON CONFLICT (numero_nv) DO UPDATE SET fecha_compra = '${nv.fechanvt}'
   RETURNING id, numero_nv`
      )
      const nvRecord = nvRows.rows[0] as { id: string; numero_nv: string }

      // 5. Por cada producto: crear/actualizar en App Arjun + entrada sin bodega
      for (const item of items) {
        // Crear o actualizar producto
        const [producto] = await db.insert(productos).values({
          codigo: item.codigo,
          descripcion: item.detalle,
          packing: Number(item.cantcaja),
        }).onConflictDoUpdate({
          target: [productos.codigo],
          set: { 
            descripcion: item.detalle,
            packing: Number(item.cantcaja),
            updatedAt: new Date()
          }
        }).returning()

        // Crear entrada SIN bodega (bodegaId: null)
        await db.execute(
          `INSERT INTO entradas (producto_id, nota_venta_id, bodega_id, cantidad, precio_unitario, usuario_id, origen)
   VALUES ('${producto.id}', '${nvRecord.id}', NULL, ${item.saldo > 0 ? Number(item.saldo) : Number(item.cantcaja)}, '${item.costo ?? 0}', NULL, 'winfac')`
        )

        productosCreados++
      }

      nvsImportadas++
      nuevaUltimaNV = nv.knumfoli

    } catch (err) {
      console.error(`Error procesando NV ${nv.knumfoli}:`, err)
    }
  }

  // 6. Actualizar watermark
  await db.execute(
    `UPDATE sync_winfac_log SET ultima_nv_procesada = '${nuevaUltimaNV}', ultima_sync_at = now(), nvs_importadas = nvs_importadas + ${nvsImportadas}, productos_creados = productos_creados + ${productosCreados} WHERE id = (SELECT id FROM sync_winfac_log ORDER BY id DESC LIMIT 1)`
  )

  return NextResponse.json({
    message: "Sync completado",
    nvs_importadas: nvsImportadas,
    productos_creados: productosCreados,
    ultima_nv_procesada: nuevaUltimaNV,
  })
}

