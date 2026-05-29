import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

function read(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf-8') : ''
}

// ============================================================
// db/schema.ts — tabla traslados + unique en stock
// ============================================================

describe('Schema — tabla traslados', () => {
  const schemaPath = join(process.cwd(), 'db', 'schema.ts')

  it('debe exportar la tabla traslados', () => {
    expect(read(schemaPath)).toContain('export const traslados')
  })

  it('traslados debe tener productoId FK a productos', () => {
    const c = read(schemaPath)
    expect(c).toContain('references(() => productos.id)')
    expect(c).toContain('traslados')
    expect(c).toContain('productoId')
  })

  it('traslados debe tener bodegaOrigenId y bodegaDestinoId FK a bodegas', () => {
    const c = read(schemaPath)
    expect(c).toContain('bodegaOrigenId')
    expect(c).toContain('bodegaDestinoId')
    expect(c).toContain('references(() => bodegas.id)')
  })

  it('traslados debe tener campo cantidad integer notNull', () => {
    const c = read(schemaPath)
    expect(c).toMatch(/cantidad.*integer.*notNull/)
  })

  it('traslados debe tener usuarioId FK a usuarios', () => {
    const c = read(schemaPath)
    expect(c).toContain('references(() => usuarios.id)')
  })

  it('traslados debe tener observaciones text', () => {
    expect(read(schemaPath)).toContain('observaciones')
  })

  it('stock debe tener unique en (producto_id, bodega_id)', () => {
    const c = read(schemaPath)
    expect(c).toMatch(/unique\(.*producto.*bodega|unique\(.*bodega.*producto/)
  })
})

// ============================================================
// Migration SQL
// ============================================================

describe('Migration — add_traslados.sql', () => {
  const migPath = join(process.cwd(), 'db', 'migrations', 'add_traslados.sql')

  it('debe existir el archivo de migración', () => {
    expect(existsSync(migPath)).toBe(true)
  })

  it('debe crear tabla public.traslados', () => {
    expect(read(migPath)).toContain('CREATE TABLE')
    expect(read(migPath)).toContain('traslados')
  })

  it('debe tener CHECK (cantidad > 0)', () => {
    expect(read(migPath)).toMatch(/CHECK.*cantidad.*>.*0/)
  })

  it('debe tener FK a productos, bodegas (x2), usuarios', () => {
    const c = read(migPath)
    expect(c).toContain('REFERENCES public.productos')
    expect(c).toContain('REFERENCES public.bodegas')
    expect(c).toContain('REFERENCES public.usuarios')
  })
})

// ============================================================
// API /api/traslados
// ============================================================

describe('API POST /api/traslados', () => {
  const apiPath = join(process.cwd(), 'app', 'api', 'traslados', 'route.ts')

  it('debe existir el archivo de ruta', () => {
    expect(existsSync(apiPath)).toBe(true)
  })

  it('debe exportar función POST', () => {
    expect(read(apiPath)).toMatch(/export.*function.*POST/)
  })

  it('debe validar cantidad > 0', () => {
    const c = read(apiPath)
    expect(c).toMatch(/cant\s*[<>=]+\s*0|cantidad\s*[<>=]+\s*0/)
  })

  it('debe validar bodegaOrigenId ≠ bodegaDestinoId', () => {
    const c = read(apiPath)
    expect(c).toMatch(/bodegaOrigenId.*bodegaDestinoId|origen.*destino.*igual|misma.*bodega/)
  })

  it('debe verificar stock suficiente en origen', () => {
    expect(read(apiPath)).toMatch(/stock.*insuficiente|Stock insuficiente|cantidad_actual/)
  })

  it('debe hacer UPDATE stock SET cantidad_actual = cantidad_actual - cantidad', () => {
    const c = read(apiPath)
    expect(c).toContain('cantidad_actual')
    expect(c).toMatch(/UPDATE.*stock|stock.*UPDATE/)
  })

  it('debe hacer INSERT INTO traslados', () => {
    expect(read(apiPath)).toContain('traslados')
  })

  it('debe retornar { ok: true, traslado } en éxito', () => {
    expect(read(apiPath)).toContain('ok')
  })

  it('debe usar transacción (db.transaction)', () => {
    const c = read(apiPath)
    expect(c).toMatch(/transaction|db\.transaction/)
  })
})

// ============================================================
// TrasladoModal component
// ============================================================

describe('TrasladoModal component', () => {
  const modalPath = join(process.cwd(), 'components', 'bodegas', 'TrasladoModal.tsx')

  it('debe existir el componente', () => {
    expect(existsSync(modalPath)).toBe(true)
  })

  it('debe ser "use client"', () => {
    expect(read(modalPath)).toContain('"use client"')
  })

  it('debe tener select de bodega destino', () => {
    const c = read(modalPath)
    expect(c).toMatch(/select|Select/ )
    expect(c).toContain('bodegaDestino')
  })

  it('debe filtrar la bodega origen del select de destino', () => {
    const c = read(modalPath)
    expect(c).toMatch(/filter.*bodega|excluir.*origen|!==.*bodegaOrigen/)
  })

  it('debe tener input de cantidad con max = stock actual', () => {
    expect(read(modalPath)).toContain('max')
  })

  it('debe hacer POST a /api/traslados', () => {
    expect(read(modalPath)).toContain('/api/traslados')
  })
})

// ============================================================
// Bodega detail page — botón Trasladar
// ============================================================

describe('Bodega detail — botón Trasladar', () => {
  const pagePath = join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx')
  const listPath = join(process.cwd(), 'components', 'bodegas', 'BodegaProductList.tsx')

  it('debe importar BodegaProductList', () => {
    expect(read(pagePath)).toContain('BodegaProductList')
  })

  it('debe pasar allBodegas como prop al componente', () => {
    const c = read(pagePath)
    expect(c).toContain('allBodegas')
    expect(c).toContain('bodegas={allBodegas}')
  })

  it('BodegaProductList debe tener botón "Trasladar"', () => {
    expect(read(listPath)).toContain('Trasladar')
  })

  it('BodegaProductList debe importar TrasladoModal', () => {
    expect(read(listPath)).toContain('TrasladoModal')
  })
})
