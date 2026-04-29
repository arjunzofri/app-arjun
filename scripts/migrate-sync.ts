import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  // 1. Hacer bodega_id nullable en entradas
  await sql`ALTER TABLE entradas ALTER COLUMN bodega_id DROP NOT NULL`
  console.log('✓ bodega_id ahora es nullable')

  // 2. Crear tabla sync_winfac_log
  await sql`
    CREATE TABLE IF NOT EXISTS sync_winfac_log (
      id serial PRIMARY KEY,
      ultima_nv_procesada text DEFAULT '000000',
      ultima_sync_at timestamp DEFAULT now(),
      nvs_importadas integer DEFAULT 0,
      productos_creados integer DEFAULT 0
    )
  `
  console.log('✓ tabla sync_winfac_log creada')

  // 3. Insertar registro inicial si no existe
  await sql`
    INSERT INTO sync_winfac_log (ultima_nv_procesada, nvs_importadas, productos_creados)
    SELECT '000000', 0, 0
    WHERE NOT EXISTS (SELECT 1 FROM sync_winfac_log LIMIT 1)
  `
  console.log('✓ registro inicial insertado')
}

migrate().catch(console.error)
