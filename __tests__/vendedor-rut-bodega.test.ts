import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================================
// Tests estructurales — sync_arjun_neon.py
// ============================================================

describe('Sync Python — leer_vendedor_rut()', () => {
  const pyPath = join(process.cwd(), 'sync-arjun', 'sync_arjun_neon.py')

  it('debe existir sync_arjun_neon.py', () => {
    expect(existsSync(pyPath)).toBe(true)
  })

  it('debe contener la función leer_vendedor_rut', () => {
    const content = readFileSync(pyPath, 'utf-8')
    expect(content).toContain('def leer_vendedor_rut')
  })

  it('debe usar xml.etree.ElementTree para parsear XML', () => {
    const content = readFileSync(pyPath, 'utf-8')
    expect(content).toMatch(/xml\.etree\.ElementTree|ElementTree/)
  })

  it('debe buscar el tag vendedor_rut_numero en el XML', () => {
    const content = readFileSync(pyPath, 'utf-8')
    expect(content).toContain('vendedor_rut_numero')
  })

  it('debe extraer visación base con split("-")[:3]', () => {
    const content = readFileSync(pyPath, 'utf-8')
    expect(content).toMatch(/split\(.*-.*\)/)
  })

  it('debe buildear ruta Z:\\newdesar\\winfac_sve\\base\\docsve\\{visacion}.xml', () => {
    const content = readFileSync(pyPath, 'utf-8')
    expect(content).toContain('docsve')
    expect(content).toContain('.xml')
  })
})

describe('Sync Python — enriquecimiento inv_sdo con vendedor_rut', () => {
  const pyPath = join(process.cwd(), 'sync-arjun', 'sync_arjun_neon.py')

  it('TABLAS["inv_sdo"]["columnas"] debe incluir vendedor_rut', () => {
    const content = readFileSync(pyPath, 'utf-8')
    // Buscar que en la sección de inv_sdo aparezca vendedor_rut en las columnas
    expect(content).toContain('vendedor_rut')
  })

  it('debe enriquecer rows con vendedor_rut antes del UPSERT', () => {
    const content = readFileSync(pyPath, 'utf-8')
    // Debe haber un bucle que llame a leer_vendedor_rut
    expect(content).toMatch(/leer_vendedor_rut\(.*knumezet/)
  })
})

describe('Sync SQL — schema.sql', () => {
  const schemaPath = join(process.cwd(), 'sync-arjun', 'schema.sql')

  it('inv_sdo debe tener columna vendedor_rut TEXT', () => {
    const content = readFileSync(schemaPath, 'utf-8')
    expect(content).toMatch(/vendedor_rut\s+TEXT/)
  })
})

// ============================================================
// Test unitario — getBodegaPorVendedor()
// ============================================================

describe('getBodegaPorVendedor()', () => {
  // Importamos la función real — si el archivo no existe aún, lo creamos en Fase C
  const utilPath = join(process.cwd(), 'lib', 'utils', 'get-bodega-por-vendedor.ts')

  it('debe existir lib/utils/get-bodega-por-vendedor.ts', () => {
    expect(existsSync(utilPath)).toBe(true)
  })

  it('debe exportar función getBodegaPorVendedor', () => {
    if (!existsSync(utilPath)) return
    const content = readFileSync(utilPath, 'utf-8')
    expect(content).toMatch(/export\s+function\s+getBodegaPorVendedor/)
  })

  it('debe contener las constantes BODEGA_VIDA_DIGITAL_1 y BODEGA_ARJUN', () => {
    if (!existsSync(utilPath)) return
    const content = readFileSync(utilPath, 'utf-8')
    expect(content).toContain('e9a760f0-6a29-4b38-bc9b-d94d55d3f272')
    expect(content).toContain('8c18bacf-698c-443f-b5ae-6a40e22bbe7e')
  })

  it('debe contener RUTS_VIDA_DIGITAL con 77854664 y 76254375', () => {
    if (!existsSync(utilPath)) return
    const content = readFileSync(utilPath, 'utf-8')
    expect(content).toContain('77854664')
    expect(content).toContain('76254375')
  })

  // Tests de lógica — podemos importar la función si existe
  it('retorna BODEGA_VIDA_DIGITAL_1 para RUT 77854664', async () => {
    if (!existsSync(utilPath)) return
    const { getBodegaPorVendedor } = await import(
      join(process.cwd(), 'lib', 'utils', 'get-bodega-por-vendedor.ts')
    )
    expect(getBodegaPorVendedor('77854664')).toBe('e9a760f0-6a29-4b38-bc9b-d94d55d3f272')
  })

  it('retorna BODEGA_VIDA_DIGITAL_1 para RUT 76254375', async () => {
    if (!existsSync(utilPath)) return
    const { getBodegaPorVendedor } = await import(
      join(process.cwd(), 'lib', 'utils', 'get-bodega-por-vendedor.ts')
    )
    expect(getBodegaPorVendedor('76254375')).toBe('e9a760f0-6a29-4b38-bc9b-d94d55d3f272')
  })

  it('retorna BODEGA_ARJUN para un RUT cualquiera (Sanjh)', async () => {
    if (!existsSync(utilPath)) return
    const { getBodegaPorVendedor } = await import(
      join(process.cwd(), 'lib', 'utils', 'get-bodega-por-vendedor.ts')
    )
    expect(getBodegaPorVendedor('12345678')).toBe('8c18bacf-698c-443f-b5ae-6a40e22bbe7e')
  })

  it('retorna BODEGA_ARJUN para null', async () => {
    if (!existsSync(utilPath)) return
    const { getBodegaPorVendedor } = await import(
      join(process.cwd(), 'lib', 'utils', 'get-bodega-por-vendedor.ts')
    )
    expect(getBodegaPorVendedor(null)).toBe('8c18bacf-698c-443f-b5ae-6a40e22bbe7e')
  })
})

// ============================================================
// Test estructural — API winfac incluye vendedor_rut
// ============================================================

describe('API /api/entradas/winfac — vendedor_rut en respuesta', () => {
  const apiPath = join(process.cwd(), 'app', 'api', 'entradas', 'winfac', 'route.ts')

  it('la query SQL debe seleccionar vendedor_rut', () => {
    const content = readFileSync(apiPath, 'utf-8')
    expect(content).toContain('vendedor_rut')
  })
})

// ============================================================
// Test estructural — WinFacPanel auto-selecciona bodega
// ============================================================

describe('WinFacPanel — pre-selección de bodega por vendedor_rut', () => {
  const panelPath = join(process.cwd(), 'components', 'entradas', 'WinFacPanel.tsx')

  it('debe importar getBodegaPorVendedor', () => {
    const content = readFileSync(panelPath, 'utf-8')
    expect(content).toContain('getBodegaPorVendedor')
  })

  it('debe usar getBodegaPorVendedor para pre-seleccionar bodegaId', () => {
    const content = readFileSync(panelPath, 'utf-8')
    expect(content).toMatch(/getBodegaPorVendedor\(/)
  })
})
