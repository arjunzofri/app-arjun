import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const FORM = join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx')

function readForm(): string {
  if (!existsSync(FORM)) throw new Error(`No existe ${FORM}`)
  return readFileSync(FORM, 'utf-8')
}

describe('SalidaForm — validación de módulo y bodega en onSubmit', () => {
  it('debe validar moduloDestinoId dentro de onSubmit', () => {
    const content = readForm()
    expect(content).toContain('moduloDestinoId')
    // La validación debe estar DENTRO de la función onSubmit, no en onClick
    expect(content).toMatch(/onSubmit[\s\S]*moduloDestinoId/)
  })

  it('debe validar bodegaOrigenId dentro de onSubmit', () => {
    const content = readForm()
    expect(content).toMatch(/onSubmit[\s\S]*bodegaOrigenId/)
  })

  it('debe mostrar error "Selecciona un módulo de destino" cuando falta moduloDestinoId', () => {
    const content = readForm()
    expect(content).toContain('Selecciona un módulo de destino')
  })

  it('debe mostrar error "Selecciona una bodega de origen" cuando falta bodegaOrigenId', () => {
    const content = readForm()
    expect(content).toContain('Selecciona una bodega de origen')
  })

  it('debe hacer setLoading(false) ANTES de return en cada validación', () => {
    const content = readForm()
    // Al menos 3 setLoading(false): stock, modulo, bodega
    const matches = content.match(/setLoading\(false\)/g)
    expect(matches?.length).toBeGreaterThanOrEqual(3)
  })

  it('los botones submit NO deben tener onClick con validación', () => {
    const content = readForm()
    // Verificar que no hay onClick en los Button type="submit"
    const submitWithOnClick = content.match(/type="submit"[^>]*onClick/)
    expect(submitWithOnClick).toBeNull()
  })
})
