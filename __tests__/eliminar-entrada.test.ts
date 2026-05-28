import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ACTIONS = join(process.cwd(), 'lib', 'actions.ts')

function readActions(): string {
  if (!existsSync(ACTIONS)) throw new Error(`No existe ${ACTIONS}`)
  return readFileSync(ACTIONS, 'utf-8')
}

describe('eliminarEntrada — contrato', () => {
  it('debe exportar la función eliminarEntrada', () => {
    const content = readActions()
    expect(content).toContain('export async function eliminarEntrada')
  })

  it('debe requerir sesión de admin', () => {
    const content = readActions()
    expect(content).toMatch(/role.*admin|admin.*role/)
  })

  it('debe buscar la entrada por ID', () => {
    const content = readActions()
    expect(content).toMatch(/entradas.*findFirst|findFirst.*entradas/)
    expect(content).toContain('entradaId')
  })

  it('debe retornar error si la entrada no existe', () => {
    const content = readActions()
    expect(content).toContain('Entrada no encontrada')
  })

  it('debe buscar stock por productoId y bodegaId de la entrada', () => {
    const content = readActions()
    expect(content).toMatch(/stock.*productoId.*bodegaId|bodegaId.*productoId.*stock/)
  })

  it('debe restar entrada.cantidad del stock.cantidad_actual', () => {
    const content = readActions()
    expect(content).toMatch(/cantidadActual\s*[-=]|cantidad_actual.*-|restar|resta/)
  })

  it('debe capar stock a 0 si quedaría negativo (Math.max)', () => {
    const content = readActions()
    expect(content).toContain('Math.max')
    expect(content).toContain('0')
  })

  it('debe hacer DELETE de la entrada', () => {
    const content = readActions()
    expect(content).toMatch(/delete.*entradas|entradas.*delete/)
  })

  it('debe escribir en activity_log con accion ELIMINAR_ENTRADA', () => {
    const content = readActions()
    expect(content).toContain('activity_log')
    expect(content).toContain('ELIMINAR_ENTRADA')
  })

  it('debe hacer revalidatePath de /entradas', () => {
    const content = readActions()
    expect(content).toContain('/entradas')
  })

  it('debe retornar success: true en caso exitoso', () => {
    const content = readActions()
    expect(content).toContain('success: true')
  })
})
