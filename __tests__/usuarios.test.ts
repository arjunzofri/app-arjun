import { describe, it, expect, vi } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('módulo de usuarios', () => {
  it('components/usuarios/UsuarioModal.tsx debe existir', () => {
    const filePath = join(process.cwd(), 'components', 'usuarios', 'UsuarioModal.tsx')
    expect(existsSync(filePath)).toBe(true)
  })

  it('UsuarioModal debe exportar un componente por defecto', async () => {
    const filePath = join(process.cwd(), 'components', 'usuarios', 'UsuarioModal.tsx')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('export default')
    } else {
      expect(true).toBe(false)
    }
  })

  it('lib/user-actions.ts no debe usar /dashboard en revalidatePath', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'user-actions.ts'),
      'utf-8'
    )
    expect(content).not.toContain('/dashboard')
  })

  it('app/(dashboard)/usuarios/page.tsx debe usar UsuarioModal', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'usuarios', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('UsuarioModal')
  })
})
