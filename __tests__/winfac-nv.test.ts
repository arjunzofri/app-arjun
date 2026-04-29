import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('WinFac búsqueda por NV y visación', () => {
  it('la API debe buscar en vida.movidcto', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('vida.movidcto')
  })

  it('la API debe buscar en sanjh.movidcto', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('sanjh.movidcto')
  })

  it('la API debe filtrar por kcodclie IN (2, 20, 173, 218)', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('173')
    expect(content).toContain('kcodclie')
  })

  it('la API debe soportar busqueda por visaadua', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('visaadua')
  })

  it('la API debe usar vida.itemdcto para obtener productos', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('vida.itemdcto')
  })

  it('el WinFacPanel debe mostrar número de NV y visación en el resultado', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx'),
      'utf-8'
    )
    expect(content).toContain('visaadua')
    expect(content).toContain('fechanvt')
  })
})
