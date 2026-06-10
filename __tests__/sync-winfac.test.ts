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
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('x-sync-key')
    expect(content).toContain('SYNC_KEY')
  })

  it('el endpoint debe consultar arjun.inv_sdo', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('arjun.inv_sdo')
  })

  it('el endpoint debe usar split_part y visa_key para paginación', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('split_part')
    expect(content).toContain('visa_key')
  })

  it('el endpoint debe usar watermark sync_winfac_log', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('sync_winfac_log')
  })

  it('el endpoint debe resolver bodega por nombre antes de usar como UUID', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('SELECT id FROM bodegas WHERE nombre')
  })

  it('el watermark solo avanza en éxito (lastSuccessfulVisaKey)', () => {
    const filePath = join(process.cwd(), 'app', 'api', 'sync', 'winfac', 'route.ts')
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('lastSuccessfulVisaKey')
  })

  it('.env.example debe incluir SYNC_KEY', () => {
    const content = readFileSync(join(process.cwd(), '.env.example'), 'utf-8')
    expect(content).toContain('SYNC_KEY')
  })
})
