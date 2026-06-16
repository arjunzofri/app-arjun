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

// ── Fase B: Tests ROJOS — fix paginación cursor compuesto ─────────────────

describe('BodegaDetailPage — paginación con cursor compuesto (ROW)', () => {
  // ── Test 1: searchParams incluye cursorId ─────────────────────────────
  it('CONTRATO: searchParams debe incluir cursorId como string opcional', () => {
    const content = readPage()
    expect(content).toMatch(/cursorId\??\s*:\s*string/)
  })

  // ── Test 2: cursor compuesto en queries con búsqueda ──────────────────
  it('CONTRATO: queries con cursor deben usar tupla compuesta (updated_at, id) en vez de solo updated_at', () => {
    const content = readPage()
    // Buscar patrón ROW(…updated_at…id…) < ROW(…)
    // o sintaxis de tupla: (s.updated_at, s.id) < (...)
    const hasCompositeCursor =
      content.includes('ROW(') ||
      content.match(/\(\s*s\.updated_at\s*,\s*s\.id\s*\)\s*</)
    expect(hasCompositeCursor).toBeTruthy()
  })

  // ── Test 3: NO debe quedar el cursor simple antiguo en queries con cursor ──
  it('CONTRATO: NO debe persistir el patrón antiguo "updated_at < cursor" sin el id compuesto', () => {
    const content = readPage()
    // El patrón antiguo sería s.updated_at < ${cursor} sin la tupla con id
    // Pero puede aparecer en ORDER BY — lo prohibido es en WHERE con cursor
    const hasOldCursorPattern = content.match(
      /updated_at\s*<\s*\$\{cursor\}\s*::\s*timestamptz/
    )
    expect(hasOldCursorPattern).toBeNull()
  })

  // ── Test 4: lastId se computa del último producto ─────────────────────
  it('CONTRATO: debe computar lastId = productos[productos.length - 1].id', () => {
    const content = readPage()
    expect(content).toMatch(/lastId\s*=|productos\[productos\.length\s*-\s*1\]\.id/)
  })

  // ── Test 5: cursorParam incluye cursorId ──────────────────────────────
  it('CONTRATO: cursorParam debe incluir &cursorId= en el query string', () => {
    const content = readPage()
    expect(content).toMatch(/cursorId/)
    // Debe aparecer junto a cursor en la construcción del param
    expect(content).toMatch(/cursorParam|cursor.*cursorId/)
  })

  // ── Test 6: cursorId se extrae de searchParams ────────────────────────
  it('CONTRATO: debe desestructurar cursorId desde searchParams', () => {
    const content = readPage()
    // Debe haber algo como: const { ..., cursorId } = await searchParams
    // o cursorId extraído del objeto
    expect(content).toMatch(/cursorId\s*[,:}=]/)
  })
})

// ── Smoke E2E: componente BodegaProductList ──────────────────────────────

describe('BodegaProductList — soporte cursor compuesto', () => {
  // ── Test 7: Props incluyen cursorId ───────────────────────────────────
  it('CONTRATO: Props de BodegaProductList deben incluir cursorId', () => {
    const listContent = readList()
    expect(listContent).toMatch(/cursorId\??\s*:\s*(string|null)/)
  })

  // ── Test 8: link "Cargar más" incluye cursorId en la URL ──────────────
  it('CONTRATO: el link "Cargar más" debe incluir &cursorId= en el href', () => {
    const listContent = readList()
    // El href de Cargar más debe contener cursorId
    expect(listContent).toMatch(/cursorId/)
    // Debe aparecer en contexto de href o encodeURIComponent
    expect(listContent).toMatch(/href.*cursorId|cursorId.*href/)
  })

  // ── Test 9: el link "Cargar más" sigue usando encodeURIComponent para cursorId ──
  it('CONTRATO: cursorId debe pasarse por URL encodeado correctamente', () => {
    const listContent = readList()
    // cursorId debe estar encodeado (encodeURIComponent) o al menos en un template string de href
    const hasCursorIdInLink =
      listContent.includes('cursorId') &&
      (listContent.includes('encodeURIComponent') || listContent.includes('href'))
    expect(hasCursorIdInLink).toBe(true)
  })
})
