import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Badges productos sin bodega', () => {
  it('el layout debe consultar productos sin stock (NOT IN stock)', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'layout.tsx'),
      'utf-8'
    )
    expect(content).toContain('NOT IN (SELECT producto_id FROM stock)')
  })

  it('el layout debe mostrar badge SIN BODEGA via sinBodegaCount', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'layout.tsx'),
      'utf-8'
    )
    expect(content).toContain('sinBodegaCount')
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
