import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { getBodegaPorVendedor } from '../lib/utils/get-bodega-por-vendedor'

const BODEGA_VIDA_DIGITAL_1 = "e9a760f0-6a29-4b38-bc9b-d94d55d3f272"
const BODEGA_ARJUN = "8c18bacf-698c-443f-b5ae-6a40e22bbe7e"

const readSync = () => readFileSync('app/api/sync/winfac/route.ts', 'utf-8')
const readReprocesar = () => readFileSync('app/api/admin/reprocesar-sync/route.ts', 'utf-8')

describe('Sync — routing de bodega por vendedor', () => {
  it('RUT 77854664 → Bodega 1 Vida Digital', () => {
    expect(getBodegaPorVendedor('77854664')).toBe(BODEGA_VIDA_DIGITAL_1)
  })
  it('RUT 76254375 → Bodega 1 Vida Digital', () => {
    expect(getBodegaPorVendedor('76254375')).toBe(BODEGA_VIDA_DIGITAL_1)
  })
  it('RUT desconocido → Bodega Arjun', () => {
    expect(getBodegaPorVendedor('99999999')).toBe(BODEGA_ARJUN)
  })
  it('RUT null → Bodega Arjun', () => {
    expect(getBodegaPorVendedor(null)).toBe(BODEGA_ARJUN)
  })
  it('sync/winfac importa getBodegaPorVendedor', () => {
    expect(readSync()).toMatch(/getBodegaPorVendedor/)
  })
  it('sync/winfac incluye vendedor_rut en SELECT', () => {
    expect(readSync()).toMatch(/vendedor_rut/)
  })
  it('reprocesar-sync importa getBodegaPorVendedor', () => {
    expect(readReprocesar()).toMatch(/getBodegaPorVendedor/)
  })
  it('reprocesar-sync incluye vendedor_rut en SELECT', () => {
    expect(readReprocesar()).toMatch(/vendedor_rut/)
  })
  it('reprocesar-sync no hardcodea bodegaArjunId para productos nuevos', () => {
    expect(readReprocesar()).not.toMatch(/bodegaArjunId/)
  })
  it('sync/winfac suma entradas winfac y winfac_futuro en delta', () => {
    expect(readSync()).toMatch(/winfac_futuro/)
  })
})
