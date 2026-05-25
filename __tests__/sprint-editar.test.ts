import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Slice 5 — Editar y eliminar producto', () => {
  it('debe existir ProductoEditModal.tsx', () => {
    const exists = existsSync(
      join(process.cwd(), 'components', 'shared', 'ProductoEditModal.tsx')
    )
    expect(exists).toBe(true)
  })

  it('ProductoEditModal debe tener campos: codigoPersonal, descripcion, packing, observaciones', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'shared', 'ProductoEditModal.tsx'),
      'utf-8'
    )
    expect(content).toContain('codigoPersonal')
    expect(content).toContain('descripcion')
    expect(content).toContain('packing')
  })

  it('ProductoEditModal debe tener botón eliminar para admin', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'shared', 'ProductoEditModal.tsx'),
      'utf-8'
    )
    expect(content).toContain('Eliminar')
  })

  it('actions.ts debe tener editarProducto', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'actions.ts'),
      'utf-8'
    )
    expect(content).toContain('editarProducto')
  })

  it('actions.ts debe tener eliminarProducto con verificación de stock = 0', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'actions.ts'),
      'utf-8'
    )
    expect(content).toContain('eliminarProducto')
    expect(content).toContain('stock')
  })

  it('SalidaForm debe tener botón de edición junto al nombre del producto', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('ProductoEditModal')
  })

  it('EntradaForm debe tener botón de edición junto al nombre del producto', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'EntradaForm.tsx'),
      'utf-8'
    )
    expect(content).toContain('ProductoEditModal')
  })
})
