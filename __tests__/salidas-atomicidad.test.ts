import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mutable state (controla el comportamiento del mock por test) ────────────
let preQueryStock = 100      // cantidad_actual que devuelve la pre-query
let cteReturnsSalida = true  // ¿el CTE retorna fila o array vacío?
const capturedSqls: string[] = []

// ── Mock @neondatabase/serverless ──────────────────────────────────────────
// neon() retorna un tagged template que consulta las variables de estado
// para devolver resultados según el escenario de test.
vi.mock('@neondatabase/serverless', () => {
  const s = vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    const raw = Array.isArray(strings) ? strings.join('') : String(strings)
    capturedSqls.push(raw)

    // Pre-query: SELECT cantidad_actual FROM stock (sin FOR UPDATE)
    if (raw.includes('SELECT cantidad_actual FROM stock') && !raw.includes('FOR UPDATE')) {
      return Promise.resolve([{ cantidad_actual: preQueryStock }])
    }
    // CTE: WITH stock_row AS (... FOR UPDATE ...)
    if (raw.includes('FOR UPDATE')) {
      if (cteReturnsSalida) {
        return Promise.resolve([{
          id: 'salida-123',
          producto_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          bodega_origen_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          modulo_destino_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          cantidad: 5,
          observaciones: 'test salida',
          usuario_id: 'user-test',
        }])
      }
      return Promise.resolve([])
    }
    return Promise.resolve([])
  })

  return { neon: vi.fn(() => s) }
})

// ── Mock @/db ──────────────────────────────────────────────────────────────
vi.mock('@/db', () => ({
  db: {
    query: {
      stock: { findFirst: vi.fn() },
      stockModulos: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      bodegas: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          nombre: 'Bodega 1 Vida Digital',
        }),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'log-1' }]),
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

// ── Test data ──────────────────────────────────────────────────────────────
const VALID_SALIDA_INPUT = {
  productoId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  bodegaOrigenId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  moduloDestinoId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  cantidad: 5,
  observaciones: 'test salida',
}

describe('registrarSalida — atomicidad con CTE (WITH ... FOR UPDATE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedSqls.length = 0
    preQueryStock = 100
    cteReturnsSalida = true
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
  })

  // ── Test 1: CTE atómico ─────────────────────────────────────────────────
  it('INTEGRACIÓN: debe usar un CTE con FOR UPDATE para INSERT + UPDATE atómicos en una sola sentencia SQL', async () => {
    const { registrarSalida } = await import('../lib/actions')

    await registrarSalida(VALID_SALIDA_INPUT)

    // Buscar la query que contiene el CTE
    const cteQuery = capturedSqls.find(sql =>
      sql.includes('FOR UPDATE') &&
      sql.includes('INSERT INTO salidas') &&
      sql.includes('UPDATE stock')
    )

    expect(cteQuery).toBeDefined()
    expect(cteQuery).toMatch(/WITH\s+stock_row\s+AS/)
    expect(cteQuery).toMatch(/FOR\s+UPDATE/)
  })

  // ── Test 2: UPDATE con aritmética server-side ───────────────────────────
  it('INTEGRACIÓN: el UPDATE dentro del CTE debe usar aritmética atómica server-side (cantidad_actual - cantidad)', async () => {
    const { registrarSalida } = await import('../lib/actions')

    await registrarSalida(VALID_SALIDA_INPUT)

    const cteQuery = capturedSqls.find(sql => sql.includes('FOR UPDATE'))
    expect(cteQuery).toBeDefined()

    // El UPDATE debe restar server-side: cantidad_actual = cantidad_actual - ...
    expect(cteQuery).toMatch(/SET\s+cantidad_actual\s*=\s*cantidad_actual\s*-\s*/)

    // La guarda en el WHERE del CTE
    expect(cteQuery).toMatch(/stock_row\.cantidad_actual\s*>=\s*/)
  })

  // ── Smoke: happy path ───────────────────────────────────────────────────
  it('SMOKE: happy path retorna el registro de salida con id y sin error', async () => {
    const { registrarSalida } = await import('../lib/actions')

    const result = await registrarSalida(VALID_SALIDA_INPUT)

    expect(result).toBeDefined()
    expect(result).not.toHaveProperty('error')
    expect(result).toHaveProperty('id')
    expect(result.id).toBe('salida-123')
  })

  // ── Test 3: stock insuficiente (pre-query) ──────────────────────────────
  it('INTEGRACIÓN: si la pre-query muestra stock insuficiente, retorna error sin ejecutar el CTE', async () => {
    preQueryStock = 3 // solo 3 disponibles, piden 5

    const { registrarSalida } = await import('../lib/actions')

    const result = await registrarSalida(VALID_SALIDA_INPUT)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('error')
    expect(result.error).toMatch(/Stock insuficiente/i)
    expect(result.error).toContain('3')

    // NO debe haberse ejecutado el CTE
    const cteQuery = capturedSqls.find(sql => sql.includes('FOR UPDATE'))
    expect(cteQuery).toBeUndefined()
  })

  // ── Test 4: race condition (pre-query ok, CTE vacío) ────────────────────
  it('INTEGRACIÓN: si el CTE retorna vacío (race condition), retorna error sin salida huérfana', async () => {
    preQueryStock = 100  // pre-query: suficiente
    cteReturnsSalida = false // CTE: concurrente agotó el stock

    const { registrarSalida } = await import('../lib/actions')

    const result = await registrarSalida(VALID_SALIDA_INPUT)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('error')
    expect(result.error).toMatch(/concurrente|agotó/i)
  })
})
