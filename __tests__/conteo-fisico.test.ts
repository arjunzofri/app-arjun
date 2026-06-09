import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mutable state ──────────────────────────────────────────────────────────
const capturedSqls: string[] = []
let mockTransactionCalled = false

// ── Mock @neondatabase/serverless ──────────────────────────────────────────
vi.mock('@neondatabase/serverless', () => {
  const s = vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
    // Interpolar valores en el SQL capturado para assertions precisas
    const raw = strings.reduce((acc, str, i) =>
      acc + str + (i < values.length ? String(values[i]) : ''), '')
    capturedSqls.push(raw)
    return Promise.resolve([{ cantidad_actual: 96 }])
  })
  ;(s as any).transaction = vi.fn(async (queries: any[]) => {
    mockTransactionCalled = true
    // Ejecutar cada query para capturar SQL
    return queries.map(() => Promise.resolve([]))
  })
  return { neon: vi.fn(() => s) }
})

// ── Mock @/db ──────────────────────────────────────────────────────────────
vi.mock('@/db', () => ({
  db: {
    query: {
      stock: { findFirst: vi.fn().mockResolvedValue({ id: 'stock-1', cantidadActual: 48 }) },
      bodegas: { findFirst: vi.fn().mockResolvedValue({ id: 'bodega-1', nombre: 'Bodega 1' }) },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'entrada-1' }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}))

// ── Mock auth ──────────────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-test', role: 'admin' } }),
}))

// ── Mock next/cache ────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('registrarConteoFisico — UPDATE confiable con neon()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSqls.length = 0
    mockTransactionCalled = false
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
  })

  // ── Test 1: usa neon() en lugar de db.update() ─────────────────────────
  it('INTEGRACIÓN: debe usar neon() para el UPDATE de stock, no db.update() de Drizzle', async () => {
    const { db } = await import('@/db')
    const { registrarConteoFisico } = await import('../lib/actions')

    await registrarConteoFisico(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      96,
    )

    // El UPDATE de stock NO debe usar db.update (Drizzle)
    const dbUpdate = db.update as any
    const stockUpdateCalls = dbUpdate.mock?.calls?.filter?.((call: any) => {
      // Ver si alguna llamada a db.update fue para la tabla stock
      return true
    }) ?? []

    // db.update NO debe ser llamado para stock (debe usar neon() en su lugar)
    expect(dbUpdate).not.toHaveBeenCalled()

    // Debe haberse usado neon() para el UPDATE (capturado en capturedSqls)
    const stockUpdate = capturedSqls.find(sql =>
      sql.toLowerCase().includes('update') &&
      sql.toLowerCase().includes('stock') &&
      sql.toLowerCase().includes('cantidad_actual')
    )
    expect(stockUpdate).toBeDefined()
    expect(stockUpdate).toMatch(/SET\s+cantidad_actual\s*=\s*/)
  })

  // ── Smoke: reemplaza stock, no suma ────────────────────────────────────
  it('SMOKE: debe REEMPLAZAR stock.cantidad_actual con la cantidad contada, no sumarla', async () => {
    // Simular: stock actual = 48, conteo = 96, resultado debe ser 96
    const stockAnterior = 48
    const conteo = 96

    const { registrarConteoFisico } = await import('../lib/actions')

    const result = await registrarConteoFisico(
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      conteo,
    )

    // Debe retornar success
    expect(result).toEqual({ success: true })

    // Buscar el SQL del UPDATE
    const updateSql = capturedSqls.find(sql =>
      sql.toLowerCase().includes('update') &&
      sql.toLowerCase().includes('stock')
    )
    expect(updateSql).toBeDefined()

    // El UPDATE debe SET cantidad_actual = <conteo>, NO cantidad_actual + <conteo>
    if (updateSql) {
      // No debe contener patrón de suma
      expect(updateSql).not.toMatch(/cantidad_actual\s*=\s*cantidad_actual\s*\+/)
      // Debe contener el valor directo del conteo
      expect(updateSql).toContain(String(conteo))
    }
  })
})
