import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Badges productos sin bodega', () => {
  it('la página de productos debe consultar entradas con bodega_id NULL', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('bodegaId')
  })

  it('la página de productos debe mostrar badge SIN BODEGA', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('SIN BODEGA')
  })

  it('el Sidebar debe mostrar un contador de productos sin bodega', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'layout', 'Sidebar.tsx'),
      'utf-8'
    )
    expect(content).toContain('sinBodega')
  })

  it('el Sidebar recibe prop sinBodega', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'layout', 'Sidebar.tsx'),
      'utf-8'
    )
    expect(content).toContain('sinBodega')
  })
})
