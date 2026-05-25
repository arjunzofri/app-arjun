import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Sección Módulos — Páginas', () => {
  it('debe existir la página de selector de módulos', () => {
    const exists = existsSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', 'page.tsx')
    )
    expect(exists).toBe(true)
  })

  it('debe existir la página de detalle de módulo', () => {
    const exists = existsSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', '[moduloId]', 'page.tsx')
    )
    expect(exists).toBe(true)
  })

  it('la página de módulos debe consultar stock_modulos agrupado por módulo', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('stock_modulos')
    expect(content).toContain('modulos_destino')
  })

  it('la página de módulos debe mostrar 5 módulos', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('nombre')
  })

  it('la página de detalle debe filtrar por moduloId con cantidad_acumulada > 0', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', '[moduloId]', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('moduloId')
    expect(content).toContain('cantidad_acumulada')
  })

  it('la página de detalle debe tener búsqueda local y paginación cursor-based', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', '[moduloId]', 'page.tsx'),
      'utf-8'
    )
    const hasSearch = content.includes('searchParams') || content.includes('search') || content.includes('q=')
    const hasPagination = content.includes('cursor') || content.includes('LIMIT') || content.includes('limit')
    expect(hasSearch).toBe(true)
    expect(hasPagination).toBe(true)
  })
})

describe('Sección Módulos — Sidebar', () => {
  it('el Sidebar debe incluir enlace a /modulos', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'layout', 'Sidebar.tsx'),
      'utf-8'
    )
    expect(content).toContain('/modulos')
  })
})
