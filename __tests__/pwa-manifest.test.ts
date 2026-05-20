import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('PWA — manifest.json', () => {
  const manifestPath = path.resolve(__dirname, '../public/manifest.json')

  it('el archivo existe y es JSON válido', () => {
    expect(() => fs.readFileSync(manifestPath, 'utf-8')).not.toThrow()
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    expect(() => JSON.parse(raw)).not.toThrow()
  })

  it('tiene los campos requeridos de PWA', () => {
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const m = JSON.parse(raw)
    expect(m.name).toBeTruthy()
    expect(m.short_name).toBeTruthy()
    expect(m.start_url).toBe('/')
    expect(m.display).toBe('standalone')
    expect(m.theme_color).toBe('#1e3a5f')
    expect(m.icons).toBeInstanceOf(Array)
    expect(m.icons.length).toBeGreaterThan(0)
  })
})
