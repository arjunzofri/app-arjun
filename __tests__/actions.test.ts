import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const TEST_PRODUCTO_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const TEST_BODEGA_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
const TEST_MODULO_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'

vi.mock('@/db', () => ({
  db: {
    query: {
      stock: { findFirst: vi.fn().mockResolvedValue({ id: 'stock-1', cantidadActual: 100 }) },
      productos: { findFirst: vi.fn().mockResolvedValue(null) },
      usuarios: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'nv-id' }])
        }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([])
      }))
    })),
    transaction: vi.fn(),
  }
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'admin' } }),
  GET: vi.fn(),
  POST: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('actions - sin transacciones neon-http', () => {
  it('lib/actions.ts no debe contener db.transaction', () => {
    const filePath = join(process.cwd(), 'lib', 'actions.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).not.toContain('db.transaction')
  })

  it('lib/actions.ts no debe contener tx.insert ni tx.update ni tx.query', () => {
    const filePath = join(process.cwd(), 'lib', 'actions.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).not.toContain('tx.insert')
    expect(content).not.toContain('tx.update')
    expect(content).not.toContain('tx.query')
  })

  it('registrarEntrada debe completar sin usar db.transaction', async () => {
    const { db } = await import('@/db')
    const { registrarEntrada } = await import('../lib/actions')
    
    await registrarEntrada({
      productoId: TEST_PRODUCTO_ID,
      bodegaId: TEST_BODEGA_ID,
      cantidad: 10,
      origen: 'manual',
    })

    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('registrarSalida debe completar sin usar db.transaction', async () => {
    const { db } = await import('@/db')
    const { registrarSalida } = await import('../lib/actions')

    await registrarSalida({
      productoId: TEST_PRODUCTO_ID,
      bodegaOrigenId: TEST_BODEGA_ID,
      moduloDestinoId: TEST_MODULO_ID,
      cantidad: 5,
    })

    expect(db.transaction).not.toHaveBeenCalled()
  })
})
