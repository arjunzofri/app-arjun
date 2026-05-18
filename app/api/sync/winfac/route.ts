import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { productos, entradas, notasVenta, activityLog } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const syncKey = req.headers.get("x-sync-key")
  if (!syncKey || syncKey !== process.env.SYNC_KEY) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // 1. Leer watermark
  const logResult = await db.execute(
    `SELECT ultima_nv_procesada FROM sync_winfac_log ORDER BY id DESC LIMIT 1`
  )
  const ultimaNV = (logResult.rows[0] as any)?.ultima_nv_procesada ?? '000000'

  // 2. Buscar NVs nuevas desde arjun.inv
  const nvsResult = await db.execute(
    `SELECT DISTINCT factura FROM arjun.inv
     WHERE factura > '${ultimaNV}'
     ORDER BY factura ASC
     LIMIT 10`
  )

  const todasNVs = nvsResult.rows.map((r: any) => ({ knumfoli: r.factura }))

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
      // 3. Obtener productos de la NV desde arjun.inv
      const items = (await db.execute(
        `SELECT codigo, descrip, cancaja, cif, saldo, zeta as nroingreso
         FROM arjun.inv
         WHERE factura = '${nv.knumfoli}'
         ORDER BY codigo`
      )).rows as any[]

      if (items.length === 0) {
        nuevaUltimaNV = nv.knumfoli
        continue
      }

      // 4. Obtener fechaing para la NV
      const fechaResult = await db.execute(
        `SELECT fechaing FROM arjun.inv WHERE factura = '${nv.knumfoli}' LIMIT 1`
      )
      const fechanvt = (fechaResult.rows[0] as any)?.fechaing ?? new Date().toISOString().split('T')[0]

      // 5. Registrar NV en App Arjun
      const nvRows = await db.execute(
        `INSERT INTO notas_venta (numero_nv, proveedor, fecha_compra)
         VALUES ('${nv.knumfoli}', 'vida_digital', '${fechanvt}')
         ON CONFLICT (numero_nv) DO UPDATE SET fecha_compra = '${fechanvt}'
         RETURNING id, numero_nv`
      )
      const nvRecord = nvRows.rows[0] as { id: string; numero_nv: string }

      // 6. Por cada producto: crear/actualizar en App Arjun + entrada sin bodega
      for (const item of items) {
        const [producto] = await db.insert(productos).values({
          codigo: item.codigo,
          descripcion: item.descrip,
          packing: Number(item.cancaja),
        }).onConflictDoUpdate({
          target: [productos.codigo],
          set: {
            descripcion: item.descrip,
            packing: Number(item.cancaja),
            updatedAt: new Date()
          }
        }).returning()

        await db.execute(
          `INSERT INTO entradas (producto_id, nota_venta_id, bodega_id, cantidad, precio_unitario, usuario_id, origen)
           VALUES ('${producto.id}', '${nvRecord.id}', NULL, ${Number(item.saldo) > 0 ? Number(item.saldo) : Number(item.cancaja)}, '${item.cif ?? 0}', NULL, 'winfac')`
        )

        productosCreados++
      }

      nvsImportadas++
      nuevaUltimaNV = nv.knumfoli

    } catch (err) {
      console.error(`Error procesando NV ${nv.knumfoli}:`, err)
    }
  }

  // 7. Actualizar watermark
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
