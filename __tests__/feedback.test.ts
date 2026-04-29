import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('feedback visual en formularios', () => {
  it('EntradaManualForm debe mostrar mensaje de éxito', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaManualForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('éxito')
    expect(content).toContain('success')
  })

  it('SalidaForm debe tener manejo de estado error', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('error')
    expect(content).toContain('setError')
  })

  it('ProductoForm debe tener manejo de estado error', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'productos', 'ProductoForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('setError')
    expect(content).toContain('error')
  })

  it('SalidaForm debe mostrar mensaje de éxito', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('éxito')
    expect(content).toContain('success')
  })

  it('ProductoForm debe mostrar mensaje de éxito', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'productos', 'ProductoForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('éxito')
    expect(content).toContain('success')
  })
})
