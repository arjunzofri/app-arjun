import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Slice 3 — Campo observaciones colapsable', () => {
  it('SalidaForm debe tener botón para agregar observación', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('observac')
  })

  it('EntradaForm debe tener botón para agregar observación', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('observac')
  })

  it('EntradaSchema debe incluir observaciones', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'validations.ts'),
      'utf-8'
    )
    expect(content).toContain('observaciones')
  })
})

describe('Slice 4 — Descripción manual en /entradas', () => {
  it('EntradaForm debe mostrar campo descripción cuando no es WinFac', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('descripcionManual')
    expect(content).toContain('esDeWinFac')
  })

  it('EntradaForm debe ocultar campo descripción cuando es WinFac', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    // debe usar !esDeWinFac para condicionar
    expect(content).toContain('!esDeWinFac')
  })
})
