import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Sección Bodegas — Páginas', () => {
  it('debe existir la página de selector de bodegas', () => {
    const exists = existsSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', 'page.tsx')
    )
    expect(exists).toBe(true)
  })

  it('debe existir la página de detalle de bodega', () => {
    const exists = existsSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx')
    )
    expect(exists).toBe(true)
  })

  it('la página de bodegas debe consultar stock agrupado por bodega', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('stock')
    expect(content).toContain('bodegas')
  })

  it('la página de bodegas debe mostrar el nombre de cada bodega', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('nombre')
  })

  it('la página de detalle debe filtrar por bodegaId', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('bodegaId')
    expect(content).toContain('cantidad_actual')
  })

  it('la página de detalle debe tener búsqueda local por nombre/código', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'),
      'utf-8'
    )
    const hasSearch = content.includes('searchParams') || content.includes('search') || content.includes('q=')
    expect(hasSearch).toBe(true)
  })

  it('la página de detalle debe tener paginación cursor-based', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'),
      'utf-8'
    )
    const hasPagination = content.includes('cursor') || content.includes('LIMIT') || content.includes('limit')
    expect(hasPagination).toBe(true)
  })
})

describe('Sección Bodegas — Sidebar', () => {
  it('el Sidebar debe incluir enlace a /bodegas', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'layout', 'Sidebar.tsx'),
      'utf-8'
    )
    expect(content).toContain('/bodegas')
  })
})
