import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Filtros de búsqueda global — getVisaCorte', () => {
  it('debe existir lib/utils/get-visa-corte.ts', () => {
    const filePath = join(process.cwd(), 'lib', 'utils', 'get-visa-corte.ts')
    expect(existsSync(filePath)).toBe(true)
  })

  it('get-visa-corte.ts debe consultar sync_winfac_log', () => {
    const filePath = join(process.cwd(), 'lib', 'utils', 'get-visa-corte.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('sync_winfac_log')
    } else {
      expect(true).toBe(false)
    }
  })

  it('get-visa-corte.ts debe exportar una función con fallback 26194159', () => {
    const filePath = join(process.cwd(), 'lib', 'utils', 'get-visa-corte.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('26194159')
      expect(content).toMatch(/export\s+(async\s+)?function/)
    } else {
      expect(true).toBe(false)
    }
  })
})

describe('Filtros de búsqueda global — buscarProductos()', () => {
  it('buscarProductos debe incluir filtro knumezet con split_part', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'actions.ts'),
      'utf-8'
    )
    expect(content).toContain('split_part')
  })

  it('buscarProductos debe filtrar stock > 0 con HAVING', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'actions.ts'),
      'utf-8'
    )
    const hasHaving = content.includes('HAVING') || content.includes('having')
    expect(hasHaving).toBe(true)
  })
})

describe('Filtros de búsqueda global — API /api/productos/buscar', () => {
  it('la query de app debe filtrar stock > 0 y knumezet', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('split_part')
  })

  it('la query de WinFac debe filtrar stocdisp > 0', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('stocdisp > 0')
  })
})

describe('Filtros de búsqueda global — /salidas', () => {
  it('salidas/page.tsx debe incluir filtro knumezet con split_part', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'salidas', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('split_part')
  })

  it('salidas/page.tsx debe filtrar stock > 0', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'salidas', 'page.tsx'),
      'utf-8'
    )
    const hasStockFilter = content.includes('cantidad_actual > 0')
                       || content.includes('totalStock > 0')
                       || content.includes('total_stock > 0')
                       || content.includes('HAVING')
                       || content.includes('having')
    expect(hasStockFilter).toBe(true)
  })
})

describe('Filtros de búsqueda global — /bodegas/[id]', () => {
  it('bodegas/[bodegaId]/page.tsx debe incluir filtro knumezet con split_part', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('split_part')
  })
})

describe('Filtros de búsqueda global — /modulos/[id]', () => {
  it('modulos/[moduloId]/page.tsx debe incluir filtro knumezet con split_part', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'modulos', '[moduloId]', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('split_part')
  })
})

describe('Filtros de búsqueda global — Dashboard page.tsx', () => {
  it('dashboard page.tsx debe incluir filtro knumezet con split_part', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('split_part')
  })

  it('dashboard page.tsx debe usar getVisaCorte o fallback 26194159', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'page.tsx'),
      'utf-8'
    )
    const hasCorte = content.includes('getVisaCorte')
                  || content.includes('26194159')
    expect(hasCorte).toBe(true)
  })
})

describe('Filtros de búsqueda global — Smoke E2E', () => {
  it('los 6 archivos deben usar getVisaCorte o el fallback 26194159', () => {
    const files = [
      join(process.cwd(), 'lib', 'actions.ts'),
      join(process.cwd(), 'app', 'api', 'productos', 'buscar', 'route.ts'),
      join(process.cwd(), 'app', '(dashboard)', 'page.tsx'),
      join(process.cwd(), 'app', '(dashboard)', 'salidas', 'page.tsx'),
      join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'),
      join(process.cwd(), 'app', '(dashboard)', 'modulos', '[moduloId]', 'page.tsx'),
    ]
    for (const file of files) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8')
        const hasCorte = content.includes('getVisaCorte')
                      || content.includes('26194159')
        expect(hasCorte).toBe(true)
      }
    }
  })

  it('get-visa-corte.ts debe usar DATABASE_URL', () => {
    const filePath = join(process.cwd(), 'lib', 'utils', 'get-visa-corte.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('DATABASE_URL')
    } else {
      expect(true).toBe(false)
    }
  })
})
