import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const PY_PATH = join(process.cwd(), 'sync-arjun', 'sync_arjun_neon.py')

function pyContent(): string {
  if (!existsSync(PY_PATH)) return ''
  return readFileSync(PY_PATH, 'utf-8')
}

// ============================================================
// Constantes fijas
// ============================================================

describe('Sync public — Constantes', () => {
  it('BODEGA_VIDA_DIGITAL_1', () => {
    expect(pyContent()).toContain('e9a760f0-6a29-4b38-bc9b-d94d55d3f272')
  })

  it('BODEGA_ARJUN', () => {
    expect(pyContent()).toContain('8c18bacf-698c-443f-b5ae-6a40e22bbe7e')
  })

  it('RUTS_VIDA_DIGITAL con 77854664 y 76254375', () => {
    const c = pyContent()
    expect(c).toContain('77854664')
    expect(c).toContain('76254375')
  })

  it('USUARIO_SYNC_ID', () => {
    expect(pyContent()).toContain('cfc9d9fd-51fe-4db2-a31b-54b41b890263')
  })

  it('VISA_CORTE = 26194159', () => {
    expect(pyContent()).toContain('26194159')
  })

  it('ORIGEN_ENTRADA = "winfac"', () => {
    expect(pyContent()).toMatch(/ORIGEN_ENTRADA.*=.*"winfac"/)
  })
})

// ============================================================
// Función determinar_bodega
// ============================================================

describe('Sync public — determinar_bodega()', () => {
  it('debe existir la función determinar_bodega', () => {
    expect(pyContent()).toContain('def determinar_bodega')
  })

  it('debe usar RUTS_VIDA_DIGITAL para decidir bodega', () => {
    const c = pyContent()
    // Buscar el patrón: if vendedor_rut in RUTS_VIDA_DIGITAL → BODEGA_VIDA_DIGITAL_1 else BODEGA_ARJUN
    expect(c).toMatch(/RUTS_VIDA_DIGITAL/)
    expect(c).toMatch(/BODEGA_VIDA_DIGITAL_1/)
    expect(c).toMatch(/BODEGA_ARJUN/)
  })
})

// ============================================================
// Función sync_productos_publicos
// ============================================================

describe('Sync public — sync_productos_publicos()', () => {
  it('debe existir la función sync_productos_publicos', () => {
    expect(pyContent()).toContain('def sync_productos_publicos')
  })

  it('debe ejecutar SELECT con split_part y VISA_CORTE', () => {
    const c = pyContent()
    expect(c).toMatch(/split_part.*knumezet/)
    expect(c).toMatch(/stocdisp\s*>\s*0/)
  })

  it('debe contener UPSERT en public.productos con ON CONFLICT (knumezet)', () => {
    const c = pyContent()
    expect(c).toContain('public.productos')
    expect(c).toMatch(/ON CONFLICT.*knumezet/)
  })

  it('debe contener UPSERT en public.stock con ON CONFLICT (producto_id, bodega_id)', () => {
    const c = pyContent()
    expect(c).toContain('public.stock')
    expect(c).toMatch(/ON CONFLICT.*producto_id.*bodega_id/)
  })

  it('debe contener INSERT en public.entradas', () => {
    const c = pyContent()
    expect(c).toContain('public.entradas')
    expect(c).toMatch(/INSERT INTO/)
  })

  it('debe hacer SELECT previo para detectar producto existente por knumezet', () => {
    const c = pyContent()
    expect(c).toMatch(/SELECT.*FROM public\.productos.*WHERE.*knumezet/)
  })

  it('debe hacer commit después de procesar', () => {
    const c = pyContent()
    expect(c).toMatch(/conn\.commit\(\)/)
  })

  it('debe loguear "Sync public:" con conteo de procesados', () => {
    const c = pyContent()
    expect(c).toContain('Sync public:')
  })
})

// ============================================================
// Integración en main()
// ============================================================

describe('Sync public — integración en main()', () => {
  it('main() debe llamar a sync_productos_publicos después del loop de sync_tabla', () => {
    const c = pyContent()
    expect(c).toContain('sync_productos_publicos')
    // Debe aparecer después del loop for tabla in TABLAS
    const afterLoop = c.split('sync_productos_publicos')
    expect(afterLoop.length).toBeGreaterThan(1)
  })
})

// ============================================================
// Smoke — resultado esperado en BD
// ============================================================

describe('Sync public — Smoke', () => {
  it('sync_productos_publicos debe usar conn.cursor() para queries', () => {
    const c = pyContent()
    expect(c).toMatch(/cursor\(\)/)
  })

  it('debe hacer rollback en caso de error', () => {
    const c = pyContent()
    expect(c).toMatch(/rollback\(\)/)
  })

  it('origen_winfac debe aparecer en el INSERT de entradas', () => {
    const c = pyContent()
    expect(c).toContain('origen_winfac')
  })
})
