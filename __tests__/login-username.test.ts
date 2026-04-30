import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Login por nombre de usuario', () => {
  it('LoginSchema debe usar username en vez de email', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'validations.ts'),
      'utf-8'
    )
    expect(content).toContain('username')
    expect(content).not.toContain("email: z.string().email")
  })

  it('lib/auth.ts debe buscar por nombre en vez de email', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'auth.ts'),
      'utf-8'
    )
    expect(content).toContain('usuarios.nombre')
    expect(content).not.toContain('usuarios.email')
  })

  it('lib/auth.ts debe aceptar cualquier contraseña sin bcrypt', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'auth.ts'),
      'utf-8'
    )
    expect(content).not.toContain('bcrypt.compare')
  })

  it('el login page debe tener input type text para usuario', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(auth)', 'login', 'page.tsx'),
      'utf-8'
    )
    expect(content).not.toContain('type="email"')
    expect(content).toContain('Nombre')
  })
})
