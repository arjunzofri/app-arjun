import { describe, it, expect, vi } from 'vitest'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(() => ({ id: 'credentials' })),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}))

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn().mockResolvedValue(true) },
}))

describe('auth module', () => {
  it('debe exportar GET y POST desde lib/auth', async () => {
    const authModule = await import('../lib/auth')
    expect(authModule.GET).toBeDefined()
    expect(authModule.POST).toBeDefined()
  })

  it('debe exportar handlers con GET y POST', async () => {
    const authModule = await import('../lib/auth')
    // GET y POST deben ser funciones
    expect(typeof authModule.GET).toBe('function')
    expect(typeof authModule.POST).toBe('function')
  })
})

describe('next-auth type augmentation', () => {
  it('el archivo types/next-auth.d.ts debe existir', async () => {
    // Este test verifica que el módulo de tipos existe
    // Falla si el archivo no existe porque TypeScript no puede resolver los tipos
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'types', 'next-auth.d.ts')
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('types/next-auth.d.ts debe contener la declaración de role', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'types', 'next-auth.d.ts')
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toContain('role')
    } else {
      // Si no existe el archivo, el test falla
      expect(true).toBe(false)
    }
  })
})
