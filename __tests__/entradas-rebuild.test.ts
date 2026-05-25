import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Bug 1 — Sin tabs WinFac en /entradas', () => {
  it('EntradasShell no debe tener tabs WinFac/Manual', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradasShell.tsx'),
      'utf-8'
    )
    expect(content).not.toContain('winfac')
    expect(content).not.toContain('setModo')
  })

  it('EntradasShell no debe importar WinFacPanel', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradasShell.tsx'),
      'utf-8'
    )
    expect(content).not.toContain('WinFacPanel')
  })

  it('EntradasShell no debe tener botón SYNC', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradasShell.tsx'),
      'utf-8'
    )
    expect(content).not.toContain('SYNC')
  })
})

describe('Bug 2 — /entradas reconstruido como /salidas', () => {
  it('debe existir EntradaForm.tsx', () => {
    const exists = existsSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx')
    )
    expect(exists).toBe(true)
  })

  it('EntradaForm debe usar BuscadorProducto o BuscadorWinFac', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    const hasSearch = content.includes('BuscadorProducto') || content.includes('BuscadorWinFac') || content.includes('buscar')
    expect(hasSearch).toBe(true)
  })

  it('EntradaForm debe usar InputCantidad', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('InputCantidad')
  })

  it('EntradaForm debe tener botón CONFIRMAR ENTRADA', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('CONFIRMAR ENTRADA')
  })

  it('debe existir endpoint /api/productos/buscar', () => {
    const exists = existsSync(
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts')
    )
    expect(exists).toBe(true)
  })

  it('el endpoint buscar debe consultar arjun.inv_sdo', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('inv_sdo')
  })
})
