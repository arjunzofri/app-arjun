import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.WINFAC_DB_URL!)

async function inspectDB() {
  // 1. Listar todas las tablas
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `
  console.log('=== TABLAS ===')
  console.log(JSON.stringify(tables, null, 2))

  // 2. Para cada tabla, listar sus columnas
  for (const table of tables) {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = ${table.table_name}
      ORDER BY ordinal_position
    `
    console.log(`\n=== COLUMNAS DE ${table.table_name} ===`)
    console.log(JSON.stringify(columns, null, 2))
  }
}

inspectDB().catch(console.error)
