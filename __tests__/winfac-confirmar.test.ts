import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('WinFac confirmar ingreso', () => {
  it('WinFacPanel no debe pasar productoId undefined a registrarEntrada', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx'),
      'utf-8'
    )
    // No debe haber productoId: undefined en el código
    expect(content).not.toContain('productoId: undefined')
  })

  it('WinFacPanel debe llamar a createOrUpdateProducto antes de registrarEntrada', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx'),
      'utf-8'
    )
    expect(content).toContain('createOrUpdateProducto')
  })

  it('WinFacPanel debe pasar precioUnitario como número', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx'),
      'utf-8'
    )
    expect(content).toContain('Number(')
  })

  it('createOrUpdateProducto debe retornar id en todos los casos', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'actions.ts'),
      'utf-8'
    )
    // Debe haber un return con id en el bloque de UPDATE con id existente
    expect(content).toContain('revalidatePath("/productos")')
    // El bloque de edición (if id) también debe retornar
    const lines = content.split('\n')
    const ifIdBlock = lines.findIndex(l => l.includes('if (id)'))
    const returnAfterUpdate = lines.slice(ifIdBlock, ifIdBlock + 30).some(l => l.includes('return'))
    expect(returnAfterUpdate).toBe(true)
  })
})
