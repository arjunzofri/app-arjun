import { describe, it, expect, vi } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'

// Mock db para evitar que neon() falle sin DATABASE_URL
vi.mock('@/db', () => ({
  db: {
    query: { productos: { findMany: vi.fn(), findFirst: vi.fn() } },
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([]) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })),
  }
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'test-id', role: 'admin' } }),
  GET: vi.fn(),
  POST: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('EntradaManualForm', () => {
  it('el archivo components/entradas/EntradaManualForm.tsx debe existir', () => {
    const filePath = join(process.cwd(), 'components', 'entradas', 'EntradaManualForm.tsx')
    expect(existsSync(filePath)).toBe(true)
  })

  it('EntradaManualForm debe exportar un componente por defecto', async () => {
    const mod = await import('../components/entradas/EntradaManualForm')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('el tab Manual en entradas NO debe contener el texto "Panel en desarrollo"', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'app', '(dashboard)', 'entradas', 'page.tsx')
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).not.toContain('Panel en desarrollo')
  })
})
