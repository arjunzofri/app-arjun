import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

describe('integración WinFac', () => {
  it('app/api/sync/winfac/route.ts debe existir', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    expect(existsSync(filePath)).toBe(true)
  })

  it('app/api/productos/buscar/route.ts debe existir', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts')
    expect(existsSync(filePath)).toBe(true)
  })

  it('components/entradas/WinFacPanel.tsx debe existir', () => {
    const filePath = join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx')
    expect(existsSync(filePath)).toBe(true)
  })

  it('el sync debe consultar arjun.inv_sdo', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('arjun.inv_sdo')
  })

  it('el sync debe usar split_part y visa_key para watermark', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('split_part')
    expect(content).toContain('visa_key')
  })

  it('el shell de entradas NO debe usar WinFacPanel (oculto por feature flag)', () => {
    const filePath = join(process.cwd(), 'components', 'entradas', 'EntradasShell.tsx')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).not.toContain('WinFacPanel')
  })
})
