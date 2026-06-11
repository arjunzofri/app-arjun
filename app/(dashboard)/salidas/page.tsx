import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import SalidasShell from "@/components/salidas/SalidasShell";

function createLoggedNeon(): NeonQueryFunction<false, false> {
  const s = neon(process.env.DATABASE_URL!);

  // Devolvemos un Proxy que intercepta tagged template calls y loguea TODO
  return new Proxy(s, {
    apply(target, thisArg, args: [TemplateStringsArray, ...any[]]) {
      const [strings, ...values] = args;
      // Reconstruir SQL
      let sql = strings[0];
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (Array.isArray(v)) sql += `[array:${v.length}]`;
        else sql += String(v);
        sql += strings[i + 1];
      }
      const short = sql.length > 300 ? sql.substring(0, 300) + "..." : sql;
      console.error(`[neon:query:LEN=${sql.length}:START=${short.substring(0, 80)}]`);

      // Ejecutar
      const result = (target as Function).apply(thisArg, args);

      // Envolver para detectar errores
      if (result && typeof result.then === "function") {
        return result.catch((err: any) => {
          console.error(`[neon:error:LEN=${sql.length}] ${err.message}`);
          // Mostrar el substring alrededor de position (si existe)
          if (err.position) {
            const pos = parseInt(err.position);
            const ctx = sql.substring(Math.max(0, pos - 60), Math.min(sql.length, pos + 80));
            console.error(`[neon:error:position=${pos}] ...${ctx}...`);
          }
          throw err;
        });
      }
      return result;
    }
  }) as unknown as NeonQueryFunction<false, false>;
}

const s = createLoggedNeon();

export default async function SalidasPage() {
  console.error("[salidas:start]");

  // Q1: productos con stock > 0
  console.error("[salidas:q1:before]");
  const productosRows = await s`
    SELECT p.id, p.codigo, p.descripcion, p.packing,
           p.codigo_personal, p.observaciones, p.ubicacion,
           p.knumezet, p.created_at, p.updated_at
    FROM public.productos p
    WHERE EXISTS (
      SELECT 1 FROM public.stock st
      WHERE st.producto_id = p.id AND st.cantidad_actual > 0
    )
    ORDER BY p.codigo
  `;
  console.error("[salidas:q1:after] rows=" + productosRows.length);

  // Q2: bodegas
  console.error("[salidas:q2:before]");
  const bodegasDataP = s`
    SELECT id, nombre FROM public.bodegas ORDER BY nombre
  `.then(rows => rows.map((r: any) => ({ id: r.id, nombre: r.nombre })));

  // Q3: modulos
  console.error("[salidas:q3:before]");
  const modulosDataP = s`
    SELECT id, nombre FROM public.modulos_destino ORDER BY nombre
  `.then(rows => rows.map((r: any) => ({ id: r.id, nombre: r.nombre })));

  const [bodegasData, modulosData] = await Promise.all([bodegasDataP, modulosDataP]);

  const productoIds = productosRows.map((p: any) => p.id);
  let stockMap = new Map<string, { bodegaId: string; cantidadActual: number }[]>();

  if (productoIds.length > 0) {
    console.error("[salidas:q4:before] ids=" + productoIds.length);
    const stockRows = await s`
      SELECT st.producto_id, st.bodega_id, st.cantidad_actual
      FROM public.stock st
      WHERE st.producto_id = ANY(${productoIds}::uuid[])
        AND st.cantidad_actual > 0
    `;

    for (const row of stockRows) {
      const entry = { bodegaId: row.bodega_id as string, cantidadActual: row.cantidad_actual as number };
      const existing = stockMap.get(row.producto_id as string);
      if (existing) { existing.push(entry); }
      else { stockMap.set(row.producto_id as string, [entry]); }
    }
    console.error("[salidas:q4:after]");
  }

  let imagenMap = new Map<string, any[]>();
  if (productoIds.length > 0) {
    console.error("[salidas:q5:before]");
    const imgRows = await s`
      SELECT pi.producto_id, pi.url, pi.cloudinary_public_id, pi.created_at
      FROM public.producto_imagenes pi
      WHERE pi.producto_id = ANY(${productoIds}::uuid[])
      ORDER BY pi.created_at ASC
    `;

    for (const row of imgRows) {
      const existing = imagenMap.get(row.producto_id as string);
      if (!existing) {
        imagenMap.set(row.producto_id as string, [{
          url: row.url,
          cloudinaryPublicId: row.cloudinary_public_id,
          createdAt: row.created_at,
        }]);
      }
    }
    console.error("[salidas:q5:after]");
  }

  const productosData = productosRows.map((p: any) => ({
    id: p.id,
    codigo: p.codigo,
    descripcion: p.descripcion,
    packing: p.packing,
    codigoPersonal: p.codigo_personal,
    observaciones: p.observaciones,
    ubicacion: p.ubicacion,
    knumezet: p.knumezet,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    stock: stockMap.get(p.id) || [],
    imagenes: imagenMap.get(p.id) || [],
  }));

  console.error("[salidas:render]");
  return (
    <SalidasShell
      productosData={productosData}
      bodegasData={bodegasData}
      modulosData={modulosData}
    />
  );
}
