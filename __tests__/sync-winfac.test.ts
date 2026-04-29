import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

describe('Sync automático WinFac', () => {
  it('app/api/sync/winfac/route.ts debe existir', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    expect(existsSync(filePath)).toBe(true)
  })

  it('el endpoint debe autenticarse con x-sync-key', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('x-sync-key')
      expect(content).toContain('SYNC_KEY')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el endpoint debe buscar en vida.movidcto', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('vida.movidcto')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el endpoint debe buscar en sanjh.movidcto', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('sanjh.movidcto')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el endpoint debe filtrar kcodclie IN (2, 20, 218)', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('218')
      expect(content).toContain('kcodclie')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el endpoint debe filtrar solo NV con visaadua confirmada', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('visaadua')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el endpoint debe usar watermark para no reprocesar NV ya importadas', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('sync_winfac_log')
    } else {
      expect(true).toBe(false)
    }
  })

  it('el endpoint debe crear entradas sin bodega_id', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8')
      expect(content).toContain('bodegaId: null')
    } else {
      expect(true).toBe(false)
    }
  })

  it('.env.example debe incluir SYNC_KEY', () => {
    const content = readFileSync(join(process.cwd(), '.env.example'), 'utf-8')
    expect(content).toContain('SYNC_KEY')
  })
})
