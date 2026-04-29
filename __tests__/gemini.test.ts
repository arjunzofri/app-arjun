import { describe, it, expect, vi } from 'vitest'

vi.mock('@google/genai', () => {
  const MockGoogleGenAI = vi.fn().mockImplementation(function(this: any) {
    this.models = {
      generateContent: vi.fn().mockResolvedValue({
        text: '{"numero_nv":"001","fecha":"2024-01-01","items":[]}'
      })
    }
  })
  return { GoogleGenAI: MockGoogleGenAI }
})

describe('gemini module', () => {
  it('debe exportar una función analyzeInvoice', async () => {
    const geminiModule = await import('../lib/gemini')
    expect(typeof geminiModule.analyzeInvoice).toBe('function')
  })

  it('analyzeInvoice debe retornar un objeto con numero_nv, fecha e items', async () => {
    const { analyzeInvoice } = await import('../lib/gemini')
    
    // Mock de imagen base64 mínima
    const fakeImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    
    const result = await analyzeInvoice(fakeImageBase64, 'image/png')
    
    expect(result).toHaveProperty('numero_nv')
    expect(result).toHaveProperty('fecha')
    expect(result).toHaveProperty('items')
    expect(Array.isArray(result.items)).toBe(true)
  })

  it('el módulo no debe usar getGenerativeModel', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'lib', 'gemini.ts')
    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).not.toContain('getGenerativeModel')
  })
})
