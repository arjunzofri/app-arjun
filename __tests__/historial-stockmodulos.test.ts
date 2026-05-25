import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Bug 3 — Historial por producto en /salidas', () => {
  it('SalidasShell no debe tener tab Historial', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidasShell.tsx'),
      'utf-8'
    )
    expect(content).not.toContain('historial')
  })

  it('SalidasPage no debe consultar history de salidas globales', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', '(dashboard)', 'salidas', 'page.tsx'),
      'utf-8'
    )
    expect(content).not.toContain('history')
  })

  it('debe existir endpoint /api/productos/[id]/historial', () => {
    const exists = existsSync(
      join(process.cwd(), 'app', 'api', 'productos', '[id]', 'historial', 'route.ts')
    )
    expect(exists).toBe(true)
  })

  it('el endpoint historial debe unir entradas y salidas', () => {
    const content = readFileSync(
      join(process.cwd(), 'app', 'api', 'productos', '[id]', 'historial', 'route.ts'),
      'utf-8'
    )
    expect(content).toContain('entradas')
    expect(content).toContain('salidas')
  })

  it('SalidaForm debe tener onClick en imagen para abrir historial', () => {
    const content = readFileSync(
      join(process.cwd(), 'components', 'salidas', 'SalidaForm.tsx'),
      'utf-8'
    )
    const hasHistorialClick = content.includes('HistorialModal') || content.includes('historial')
    expect(hasHistorialClick).toBe(true)
  })
})

describe('Bug 4 — stock_modulos en schema y registrarSalida', () => {
  it('schema.ts debe definir tabla stockModulos', () => {
    const content = readFileSync(
      join(process.cwd(), 'db', 'schema.ts'),
      'utf-8'
    )
    expect(content).toContain('stockModulos')
  })

  it('registrarSalida debe escribir en stock_modulos', () => {
    const content = readFileSync(
      join(process.cwd(), 'lib', 'actions.ts'),
      'utf-8'
    )
    expect(content).toContain('stock_modulos')
  })
})
