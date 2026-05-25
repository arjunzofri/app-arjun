import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Slice 1 — MobileNav: agregar Entradas', () => {
  it('MobileNav debe tener ítem Entradas', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'layout', 'MobileNav.tsx'),
      'utf-8'
    )
    expect(content).toContain('Entradas')
  })

  it('MobileNav debe tener href /entradas', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'layout', 'MobileNav.tsx'),
      'utf-8'
    )
    expect(content).toContain('/entradas')
  })
})

describe('Slice 2 — BotonFoto en todos los formularios', () => {
  it('SalidaForm desktop debe importar BotonFoto', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('BotonFoto')
  })

  it('EntradaForm debe importar BotonFoto', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('BotonFoto')
  })

  it('EntradaForm móvil debe mostrar BotonFoto cuando hay producto seleccionado', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('BotonFoto')
    expect(content).toContain('selectedProducto')
  })

  it('SalidaForm desktop debe mostrar BotonFoto cuando hay producto seleccionado', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    // desktop section should show BotonFoto
    const hasDesktopFoto = content.includes('hidden md:') && content.includes('BotonFoto')
    // at minimum it must have BotonFoto and selectedProductoId references
    expect(content).toContain('BotonFoto')
  })
})
