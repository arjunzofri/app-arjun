import { describe, it, expect, vi } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

describe('integración WinFac', () => {
  it('app/api/entradas/winfac/route.ts debe existir', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts')
    expect(existsSync(filePath)).toBe(true)
  })

  it('components/entradas/WinFacPanel.tsx debe existir', () => {
    const filePath = join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx')
    expect(existsSync(filePath)).toBe(true)
  })

  it('WinFacPanel debe exportar un componente por defecto', () => {
    const filePath = join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('export default')
    } else {
      expect(true).toBe(false)
    }
  })

  it('la API de winfac debe consultar empresa_id IN (2, 20, 218)', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('2')
      expect(content).toContain('20')
      expect(content).toContain('218')
    } else {
      expect(true).toBe(false)
    }
  })

  it('la API de winfac debe usar WINFAC_DB_URL', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('WINFAC_DB_URL')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el tab WinFac en entradas debe usar WinFacPanel', () => {
    const filePath = join(process.cwd(), 'app', '(dashboard)', 'entradas', 'page.tsx')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('WinFacPanel')
  })
})
