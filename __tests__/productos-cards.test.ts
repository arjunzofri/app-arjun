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

  it('la página de productos debe mostrar imágenes de Cloudinary', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'productos', 'page.tsx'),
      'utf-8'
    )
    expect(content).toContain('dxkidwxjl')
    expect(content).toContain('cloudinary')
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
