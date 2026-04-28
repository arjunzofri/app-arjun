import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de neon para capturar cómo se llama
const mockSql = vi.fn()
vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') }
}))

describe('GET /api/setup', () => {
  beforeEach(() => {
    mockSql.mockReset()
    mockSql.mockResolvedValue([])
    process.env.DATABASE_URL = 'postgresql://fake'
    process.env.SETUP_KEY = 'arjun-setup-2025'
  })

  it('debe retornar success:true cuando el setup completa sin errores', async () => {
    const { GET } = await import('../app/api/setup/route')
    const req = new Request('http://localhost/api/setup', {
      headers: { 'x-setup-key': 'arjun-setup-2025' }
    })
    const res = await GET(req as any)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('debe retornar 401 si el setup-key es incorrecto', async () => {
    const { GET } = await import('../app/api/setup/route')
    const req = new Request('http://localhost/api/setup', {
      headers: { 'x-setup-key': 'clave-incorrecta' }
    })
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('neon no debe ser llamado como función convencional sql("query", [params])', async () => {
    const { GET } = await import('../app/api/setup/route')
    const req = new Request('http://localhost/api/setup', {
      headers: { 'x-setup-key': 'arjun-setup-2025' }
    })
    await GET(req as any)

    // Ninguna llamada debe tener el patrón de string + array separados
    const calls = mockSql.mock.calls
    for (const call of calls) {
      // template literals llegan como TemplateStringsArray (objeto con raw)
      // llamadas convencionales llegan como string plano
      const firstArg = call[0]
      expect(typeof firstArg).not.toBe('string')
    }
  })
})
