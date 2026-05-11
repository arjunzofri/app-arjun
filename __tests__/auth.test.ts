import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({}))

const mockFindFirst = vi.fn()
vi.mock('@/db', () => ({
  db: {
    query: {
      usuarios: {
        findFirst: mockFindFirst,
      },
    },
  },
}))

const mockCompare = vi.fn()
vi.mock('bcryptjs', () => ({
  default: { compare: mockCompare },
}))

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

import { LoginSchema } from '@/lib/validations'

describe('LoginSchema', () => {
  it('acepta username >= 3 caracteres con password >= 6', () => {
    const result = LoginSchema.safeParse({ username: 'pablo', password: '123456' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.username).toBe('pablo')
    }
  })

  it('rechaza username con menos de 3 caracteres', () => {
    const result = LoginSchema.safeParse({ username: 'ab', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rechaza password con menos de 6 caracteres', () => {
    const result = LoginSchema.safeParse({ username: 'pablo', password: '12345' })
    expect(result.success).toBe(false)
  })
})

describe('authorize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna usuario cuando username y password son correctos', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'u1',
      nombre: 'Pablo',
      username: 'pablo',
      email: 'pablo@arjun.cl',
      passwordHash: '$2a$10$hashed',
      rol: 'admin',
    })
    mockCompare.mockResolvedValue(true)

    const { authorize } = await import('@/lib/auth')
    const result = await authorize({ username: 'pablo', password: '123456' })

    expect(result).not.toBeNull()
    expect(result?.id).toBe('u1')
    expect(result?.name).toBe('Pablo')
  })

  it('retorna null cuando el usuario no existe', async () => {
    mockFindFirst.mockResolvedValue(null)

    const { authorize } = await import('@/lib/auth')
    const result = await authorize({ username: 'fantasma', password: 'cualquiera' })

    expect(result).toBeNull()
  })

  it('retorna null cuando el password no coincide', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'u1',
      nombre: 'Pablo',
      username: 'pablo',
      email: 'pablo@arjun.cl',
      passwordHash: '$2a$10$hashed',
      rol: 'admin',
    })
    mockCompare.mockResolvedValue(false)

    const { authorize } = await import('@/lib/auth')
    const result = await authorize({ username: 'pablo', password: 'incorrecta' })

    expect(result).toBeNull()
  })
})
