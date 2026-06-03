import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Vista de cards en productos', () => {
  it('la página de productos debe usar grid de cards', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('grid')
    expect(content).toContain('grid-cols')
  })

  it('la página de productos debe obtener imágenes desde producto_imagenes', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('productoImagenes')
    expect(content).toContain('imagenesMap')
  })

  it('la página de productos debe tener fallback cuando no hay imagen', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'productos', 'ProductImage.tsx'),
      'utf-8'
    )
    expect(content).toContain('onError')
  })

  it('las cards deben mostrar el stock del producto', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('totalStock')
  })

  it('las cards deben mostrar badge SIN BODEGA cuando aplica', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('SIN BODEGA')
  })
})

describe('Tab Movimientos en producto detail', () => {
  const detallePath = join(
    process.cwd(), 'components', 'productos', 'ProductoDetalle.tsx'
  )

  it('ProductoDetalle debe importar ProductoMovimientos', () => {
    const content = readFileSync(detallePath, 'utf-8')
    expect(content).toContain('ProductoMovimientos')
  })

  it('ProductoDetalle debe tener tab "Movimientos"', () => {
    const content = readFileSync(detallePath, 'utf-8')
    expect(content).toContain('Movimientos')
  })

  it('ProductoDetalle debe extender Tab con "movimientos"', () => {
    const content = readFileSync(detallePath, 'utf-8')
    expect(content).toContain('"movimientos"')
  })
})

describe('Componente ProductoMovimientos', () => {
  const componentPath = join(
    process.cwd(), 'components', 'productos', 'ProductoMovimientos.tsx'
  )

  it('debe existir el archivo ProductoMovimientos.tsx', () => {
    const { existsSync } = require('fs')
    expect(existsSync(componentPath)).toBe(true)
  })

  it('debe usar el endpoint /api/productos/[id]/historial', () => {
    const { existsSync, readFileSync: rfs } = require('fs')
    if (existsSync(componentPath)) {
      const content = rfs(componentPath, 'utf-8')
      expect(content).toContain('historial')
    }
  })

  it('debe tener lógica de paginación (cargar más)', () => {
    const { existsSync, readFileSync: rfs } = require('fs')
    if (existsSync(componentPath)) {
      const content = rfs(componentPath, 'utf-8')
      const hasPagination =
        content.includes('Cargar más') ||
        content.includes('hasMore') ||
        content.includes('cursor')
      expect(hasPagination).toBe(true)
    }
  })
})
