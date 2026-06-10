import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('WinFac búsqueda y sync', () => {
  it('la API de búsqueda debe consultar arjun.inv_sdo', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('arjun.inv_sdo')
  })

  it('la API de búsqueda debe usar autenticación', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('auth()')
    expect(content).toContain('Unauthorized')
  })

  it('la API de sync debe usar split_part para visa_key', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('split_part')
    expect(content).toContain('visa_key')
  })

  it('el sync debe tener watermark condicional (lastSuccessfulVisaKey)', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('lastSuccessfulVisaKey')
  })

  it('el sync debe resolver bodega por nombre', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('SELECT id FROM bodegas WHERE nombre')
  })

  it('el WinFacPanel debe mostrar productos con código y descripción', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx'),
      'utf-8'
    )
    expect(content).toContain('codigo')
  })
})
