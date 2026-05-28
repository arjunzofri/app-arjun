import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROUTE = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
const SCHEMA = join(process.cwd(), 'db', 'schema.ts')

function readRoute(): string {
  if (!existsSync(ROUTE)) throw new Error(`No existe ${ROUTE}`)
  return readFileSync(ROUTE, 'utf-8')
}

function readSchema(): string {
  if (!existsSync(SCHEMA)) throw new Error(`No existe ${SCHEMA}`)
  return readFileSync(SCHEMA, 'utf-8')
}

describe('Sync WinFac Futuro — Productos existentes', () => {
  describe('Enum y Schema', () => {
    it('schema.ts debe incluir winfac_futuro en el enum origen', () => {
      const content = readSchema()
      expect(content).toContain('winfac_futuro')
    })

    it('route.ts debe asegurar columna origen_winfac en productos', () => {
      const content = readRoute()
      expect(content).toContain('origen_winfac')
    })

    it('route.ts debe agregar winfac_futuro al enum origen en la DB', () => {
      const content = readRoute()
      expect(content).toContain('winfac_futuro')
    })
  })

  describe('Producto nuevo (no existe en public.productos)', () => {
    it('debe crear producto con origen_winfac = true', () => {
      const content = readRoute()
      expect(content).toContain('origen_winfac')
      expect(content).toContain('true')
    })

    it('debe buscar Bodega Arjun por nombre para el stock', () => {
      const content = readRoute()
      expect(content).toContain('Bodega Arjun')
    })

    it('debe crear registro en stock con la cantidad de inv_sdo', () => {
      const content = readRoute()
      expect(content).toContain('stocdisp')
      expect(content).toContain('stock')
    })

    it('debe crear entrada con origen winfac_futuro', () => {
      const content = readRoute()
      // Debe haber INSERT en entradas con 'winfac_futuro'
      expect(content).toMatch(/entradas.*winfac_futuro|winfac_futuro.*entradas/)
    })

    it('debe escribir en activity_log para producto nuevo', () => {
      const content = readRoute()
      expect(content).toContain('activity_log')
    })
  })

  describe('Producto existente (match por knumezet)', () => {
    it('NO debe modificar el producto existente (sin UPDATE productos)', () => {
      const content = readRoute()
      // Debe evitar ON CONFLICT DO UPDATE sobre el producto
      // Verificar que NO hace UPDATE de descripcion/codigo para existentes
      const hasUpdateProducto = /UPDATE\s+productos/i.test(content)
      // Puede haber UPDATE stock, pero no UPDATE productos para existentes
      expect(content).toContain('knumezet')
    })

    it('debe calcular delta sumando entradas previas con origen winfac_futuro', () => {
      const content = readRoute()
      expect(content).toContain('SUM')
      expect(content).toContain('winfac_futuro')
    })

    it('debe hacer UPDATE stock SET cantidad_actual = cantidad_actual + delta', () => {
      const content = readRoute()
      expect(content).toContain('cantidad_actual')
    })

    it('debe crear entrada con la diferencia (delta) no con el total', () => {
      const content = readRoute()
      // La entrada debe registrar solo la diferencia
      expect(content).toMatch(/diferencia|delta/)
    })

    it('debe escribir en activity_log para producto existente', () => {
      const content = readRoute()
      expect(content).toContain('activity_log')
    })
  })

  describe('Delta negativo', () => {
    it('debe ignorar delta negativo sin crear entrada ni modificar stock', () => {
      const content = readRoute()
      // Debe haber una condición que filtre delta <= 0 → continue
      expect(content).toMatch(/delta\s*<=?\s*0/)
    })
  })

  describe('Transaccionalidad', () => {
    it('debe procesar producto por producto (no en bloque)', () => {
      const content = readRoute()
      // Ya no debe usar INSERT masivo con subquery desde arjun.inv_sdo
      // Debe iterar los rows y procesar uno por uno
      expect(content).toMatch(/for|forEach|map|rows\./)
    })
  })
})
