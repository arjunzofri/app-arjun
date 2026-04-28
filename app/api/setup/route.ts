import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const setupKey = req.headers.get("x-setup-key");
  const expectedKey = process.env.SETUP_KEY;

  if (!setupKey || setupKey !== expectedKey) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  try {
    // 1. Create Enums
    await sql`
      DO $$ BEGIN
        CREATE TYPE "rol" AS ENUM('admin', 'operador');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "proveedor" AS ENUM('vida_digital', 'kingnex');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    await sql`
      DO $$ BEGIN
        CREATE TYPE "origen" AS ENUM('winfac', 'kingnex', 'manual');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // 2. Create Tables
    await sql`
      CREATE TABLE IF NOT EXISTS "usuarios" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre" text NOT NULL,
        "email" text UNIQUE NOT NULL,
        "password_hash" text NOT NULL,
        "rol" "rol" DEFAULT 'operador' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "bodegas" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre" text UNIQUE NOT NULL,
        "descripcion" text
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "modulos_destino" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre" text UNIQUE NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "productos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "codigo" text UNIQUE NOT NULL,
        "descripcion" text NOT NULL,
        "codigo_personal" text,
        "packing" integer DEFAULT 1,
        "ubicacion" text,
        "observaciones" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "producto_imagenes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "producto_id" uuid NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
        "url" text NOT NULL,
        "cloudinary_public_id" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "codigo_personal_auditoria" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "producto_id" uuid NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
        "valor_anterior" text,
        "valor_nuevo" text,
        "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
        "changed_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "notas_venta" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "numero_nv" text NOT NULL,
        "proveedor" "proveedor" NOT NULL,
        "fecha_compra" date,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "entradas" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "producto_id" uuid NOT NULL REFERENCES "productos"("id"),
        "nota_venta_id" uuid REFERENCES "notas_venta"("id"),
        "bodega_id" uuid NOT NULL REFERENCES "bodegas"("id"),
        "cantidad" integer NOT NULL,
        "precio_unitario" numeric(10, 2),
        "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
        "origen" "origen" DEFAULT 'manual' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "stock" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "producto_id" uuid NOT NULL REFERENCES "productos"("id"),
        "bodega_id" uuid NOT NULL REFERENCES "bodegas"("id"),
        "cantidad_actual" integer DEFAULT 0 NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        UNIQUE("producto_id", "bodega_id")
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "salidas" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "producto_id" uuid NOT NULL REFERENCES "productos"("id"),
        "bodega_origen_id" uuid NOT NULL REFERENCES "bodegas"("id"),
        "modulo_destino_id" uuid NOT NULL REFERENCES "modulos_destino"("id"),
        "cantidad" integer NOT NULL,
        "usuario_id" uuid NOT NULL REFERENCES "usuarios"("id"),
        "timestamp_salida" timestamp DEFAULT now() NOT NULL,
        "observaciones" text
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "activity_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "usuario_id" uuid REFERENCES "usuarios"("id"),
        "accion" text NOT NULL,
        "tabla_afectada" text,
        "registro_id" text,
        "detalle" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    // 3. Seed Data
    const hashedPass = await bcrypt.hash("arjun2025", 10);

    await sql`
      INSERT INTO "usuarios" (nombre, email, password_hash, rol)
      VALUES ('Admin', 'admin@arjun.cl', ${hashedPass}, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `;

    await sql`INSERT INTO "bodegas" (nombre) VALUES ('Bodega 1 Vida Digital') ON CONFLICT DO NOTHING;`;
    await sql`INSERT INTO "bodegas" (nombre) VALUES ('Bodega 2 Vida Digital') ON CONFLICT DO NOTHING;`;
    await sql`INSERT INTO "bodegas" (nombre) VALUES ('Bodega Arjun') ON CONFLICT DO NOTHING;`;

    await sql`INSERT INTO "modulos_destino" (nombre) VALUES ('Módulo 180') ON CONFLICT DO NOTHING;`;
    await sql`INSERT INTO "modulos_destino" (nombre) VALUES ('Módulo 182') ON CONFLICT DO NOTHING;`;
    await sql`INSERT INTO "modulos_destino" (nombre) VALUES ('Módulo 183') ON CONFLICT DO NOTHING;`;
    await sql`INSERT INTO "modulos_destino" (nombre) VALUES ('Módulo 184') ON CONFLICT DO NOTHING;`;
    await sql`INSERT INTO "modulos_destino" (nombre) VALUES ('Módulo 193') ON CONFLICT DO NOTHING;`;

    // 4. Products & Stock (More complex seed)
    const result = await sql`SELECT id FROM "bodegas" WHERE nombre = 'Bodega Arjun' LIMIT 1`;
    const bodegaArjunId = result[0]?.id;

    if (bodegaArjunId) {
      const sampleProducts = [
        ['KNX-001', 'Smartwatch Pro 4', 'A-12', 1],
        ['KNX-002', 'Audífonos Bluetooth G5', 'A-15', 1],
        ['VDA-101', 'Cargador Rápido 65W', 'B-01', 1],
        ['SKU-999', 'Funda Silicona Universal', 'C-10', 50],
        ['KING-X', 'Parlante Outdoor Kingnex', 'D-05', 1]
      ];

      for (const [codigo, desc, ubic, pack] of sampleProducts) {
        await sql`
          INSERT INTO "productos" (codigo, descripcion, ubicacion, packing)
          VALUES (${codigo}, ${desc}, ${ubic}, ${pack})
          ON CONFLICT (codigo) DO NOTHING
        `;

        // Add initial stock (if product was just created or exists)
        const prodResult = await sql`SELECT id FROM "productos" WHERE codigo = ${codigo} LIMIT 1`;
        const prodId = prodResult[0]?.id;
        
        if (prodId) {
          await sql`
            INSERT INTO "stock" (producto_id, bodega_id, cantidad_actual)
            VALUES (${prodId}, ${bodegaArjunId}, 100)
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }

    return NextResponse.json({ success: true, message: "Setup completado exitosamente" });
  } catch (error) {
    console.error("Setup Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido durante el setup" 
    }, { status: 500 });
  }
}
