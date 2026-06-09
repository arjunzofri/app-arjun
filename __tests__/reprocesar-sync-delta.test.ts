import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Capturar SQL ejecutado ─────────────────────────────────────────────────
const executedSql: string[] = []

// ── Mock @/db ──────────────────────────────────────────────────────────────
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn((sql: string) => {
      executedSql.push(sql)

      // Emular respuestas según la query
      if (sql.includes('sync_winfac_log')) {
        return Promise.resolve({ rows: [{ ultimo_numero_visa: 0 }] })
      }
      if (sql.includes('FROM arjun.inv_sdo')) {
        return Promise.resolve({
          rows: [{
            knumezet: 'ABC-123-456',
            codunico: 'COD001',
            descript: 'Producto Test',
            stocdisp: '100',
            cantcaja: '5',
            visa_key: 123456,
          }],
        })
      }
      if (sql.includes('bodegas WHERE nombre')) {
        return Promise.resolve({ rows: [{ id: 'bodega-arjun-id' }] })
      }
      if (sql.includes('usuarios WHERE rol')) {
        return Promise.resolve({ rows: [{ id: 'admin-id' }] })
      }
      if (sql.includes('productos WHERE knumezet')) {
        return Promise.resolve({ rows: [{ id: 'prod-existing-id', ubicacion: 'Bodega Arjun' }] })
      }
      if (sql.includes('COALESCE(SUM(cantidad)')) {
        return Promise.resolve({ rows: [{ total: 30 }] })
      }
      if (sql.includes('FROM stock WHERE producto_id')) {
        return Promise.resolve({ rows: [{ id: 'stock-1' }] })
      }
      // INSERT/UPDATE/ALTER/DO queries
      return Promise.resolve({ rows: [] })
    }),
  },
}))

describe('reprocesar-sync y sync/winfac — SUM debe incluir winfac y winfac_futuro', () => {
  beforeEach(() => {
    executedSql.length = 0
    process.env.SYNC_KEY = 'test-sync-key'
    process.env.DATABASE_URL = 'postgresql://test'
  })

  // ── Test 1 ──────────────────────────────────────────────────────────────
  it('INTEGRACIÓN: reprocesar-sync debe usar origen IN (winfac, winfac_futuro) al sumar entradas previas', async () => {
    const { GET } = await import('../app/api/admin/reprocesar-sync/route')

    const req = new NextRequest('http://localhost/api/admin/reprocesar-sync?desde=100000&hasta=200000', {
      headers: { 'x-sync-key': 'test-sync-key' },
    })
    await GET(req as any)

    // Buscar la query SUM de entradas previas
    const sumQuery = executedSql.find(sql =>
      sql.includes('COALESCE(SUM(cantidad)') &&
      sql.includes('producto_id') &&
      sql.includes('entradas')
    )

    expect(sumQuery).toBeDefined()
    expect(sumQuery).toMatch(/origen\s+IN\s*\(.*winfac.*,.*winfac_futuro.*\)/i)
  })

  // ── Test 2 ──────────────────────────────────────────────────────────────
  it('INTEGRACIÓN: sync/winfac debe usar origen IN (winfac, winfac_futuro) al sumar entradas previas', async () => {
    const { GET } = await import('../app/api/sync/winfac/route')

    const req = new NextRequest('http://localhost/api/sync/winfac', {
      headers: { 'x-sync-key': 'test-sync-key' },
    })
    await GET(req as any)

    const sumQuery = executedSql.find(sql =>
      sql.includes('COALESCE(SUM(cantidad)') &&
      sql.includes('producto_id') &&
      sql.includes('entradas')
    )

    expect(sumQuery).toBeDefined()
    expect(sumQuery).toMatch(/origen\s+IN\s*\(.*winfac.*,.*winfac_futuro.*\)/i)
  })

  // ── Test 3 ──────────────────────────────────────────────────────────────
  it('INTEGRACIÓN: la query SUM NO debe filtrar con origen = (un solo origen)', async () => {
    const { GET } = await import('../app/api/sync/winfac/route')

    const req = new NextRequest('http://localhost/api/sync/winfac', {
      headers: { 'x-sync-key': 'test-sync-key' },
    })
    await GET(req as any)

    const sumQuery = executedSql.find(sql =>
      sql.includes('COALESCE(SUM(cantidad)') &&
      sql.includes('entradas')
    )
    expect(sumQuery).toBeDefined()

    // No debe contener el patrón antiguo: origen = 'winfac_futuro'
    expect(sumQuery).not.toMatch(/origen\s*=\s*'winfac_futuro'/)
  })
})
