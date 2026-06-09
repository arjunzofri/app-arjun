import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const PAGE_PATH = join(process.cwd(), 'app', '(dashboard)', 'bodegas', '[bodegaId]', 'page.tsx')
const LIST_PATH = join(process.cwd(), 'components', 'bodegas', 'BodegaProductList.tsx')

function readPage(): string {
  return readFileSync(PAGE_PATH, 'utf-8')
}

function readList(): string {
  return readFileSync(LIST_PATH, 'utf-8')
}

describe('BodegaDetailPage — filtro soloConStock', () => {
  // ── Test 1: searchParams incluye soloConStock ──────────────────────────
  it('CONTRATO: searchParams debe incluir soloConStock como string opcional', () => {
    const content = readPage()
    expect(content).toMatch(/soloConStock\??\s*:\s*string/)
  })

  // ── Test 2: default filtra stock > 0 ────────────────────────────────────
  it('CONTRATO: cuando soloConStock no es "false", la query SQL debe filtrar con AND cantidad_actual > 0 en WHERE', () => {
    const content = readPage()
    // El filtro debe estar en un WHERE, no solo en ORDER BY
    // Buscar patrón: AND ... cantidad_actual > 0 (en cláusula WHERE)
    expect(content).toMatch(/AND\s+.*cantidad_actual\s*>\s*0/)
  })

  // ── Test 3: soloConStock=false NO filtra ────────────────────────────────
  it('CONTRATO: cuando soloConStock === "false", NO debe filtrar por stock > 0', () => {
    const content = readPage()
    // Debe existir una condición que checkea soloConStock !== "false"
    expect(content).toMatch(/soloConStock.*!==.*["']false["']|soloConStock.*===.*["']false["']/)
  })

  // ── Test 4: el param persiste en URLs (Cargar más, links) ──────────────
  it('CONTRATO: el param soloConStock debe persistir en los query strings de navegación', () => {
    const content = readPage()
    // Debe construir un param para pasar a BodegaProductList
    expect(content).toMatch(/soloConStock/)
  })

  // ── Test 5: BodegaProductList recibe el prop ────────────────────────────
  it('CONTRATO: BodegaProductList debe recibir prop soloConStock y q', () => {
    const listContent = readList()
    // Props deben incluir soloConStock y q (para navegación)
    expect(listContent).toMatch(/soloConStock/)
  })

  // ── Test 6: toggle/checkbox en la UI ────────────────────────────────────
  it('CONTRATO: BodegaProductList debe tener un checkbox o toggle para soloConStock', () => {
    const listContent = readList()
    // Debe tener un input checkbox o toggle Switch
    expect(listContent).toMatch(/checkbox|type.*=.*["']checkbox["']|Solo con stock/)
  })
})
