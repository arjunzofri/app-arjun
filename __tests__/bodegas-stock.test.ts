import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// ============================================================
// Fase B — Tests Rojos: 3 cambios en /bodegas
// ============================================================

describe('P2 — Mostrar productos con stock = 0', () => {
  const pagePath = join(
    process.cwd(),
    'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'
  )

  it('NO debe filtrar cantidad_actual > 0 en WHERE (mostrar todos los registros de stock)', () => {
    const content = readFileSync(pagePath, 'utf-8')
    // Después del fix, la query NO debe filtrar stock > 0 en el WHERE
    // (solo debe aparecer dentro del CASE WHEN del ORDER BY, no como filtro)
    expect(content).not.toContain('AND s.cantidad_actual > 0')
  })

  it('debe ordenar primero stock > 0, luego stock = 0', () => {
    const content = readFileSync(pagePath, 'utf-8')
    // Debe usar ORDER BY que priorice stock positivo primero
    const hasStockOrdering =
      content.includes('cantidad_actual > 0 DESC') ||
      content.includes('cantidad_actual = 0') ||
      content.includes('CASE WHEN')
    expect(hasStockOrdering).toBe(true)
  })
})

describe('P3 — Editar producto desde /bodegas (ícono lápiz)', () => {
  const componentPath = join(
    process.cwd(), 'components', 'bodegas', 'BodegaProductList.tsx'
  )
  const pagePath = join(
    process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'
  )

  it('BodegaProductList debe importar ProductoEditModal', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('ProductoEditModal')
  })

  it('BodegaProductList debe importar y renderizar ícono Pencil', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Pencil')
  })

  it('la página de bodega debe pasar userRole a BodegaProductList', () => {
    const content = readFileSync(pagePath, 'utf-8')
    // Debe obtener la sesión y pasar el rol al componente
    const hasAuthImport = content.includes('auth')
    const passesUserRole =
      content.includes('userRole') || content.includes('userRole=')
    expect(hasAuthImport).toBe(true)
    expect(passesUserRole).toBe(true)
  })
})

describe('Smoke E2E — Flujo completo edición desde bodega', () => {
  const pagePath = join(
    process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx'
  )
  const componentPath = join(
    process.cwd(), 'components', 'bodegas', 'BodegaProductList.tsx'
  )

  it('el modal ProductoEditModal se reutiliza sin crear uno nuevo en bodegas/', () => {
    const pageContent = readFileSync(pagePath, 'utf-8')
    const componentContent = readFileSync(componentPath, 'utf-8')

    // El modal se importa desde components/shared/ProductoEditModal
    const importsShared =
      componentContent.includes('@/components/shared/ProductoEditModal') ||
      componentContent.includes('components/shared/ProductoEditModal')
    expect(importsShared).toBe(true)

    // La página obtiene auth y pasa userRole
    expect(pageContent).toContain('auth')
    expect(pageContent).toContain('BodegaProductList')
  })

  it('el SELECT de la query debe incluir campos que ProductoEditModal necesita', () => {
    const content = readFileSync(pagePath, 'utf-8')
    // ProductoEditModal necesita: id, codigo, codigoPersonal, descripcion, packing, observaciones
    expect(content).toContain('codigo_personal')
    expect(content).toContain('observaciones')
  })
})
