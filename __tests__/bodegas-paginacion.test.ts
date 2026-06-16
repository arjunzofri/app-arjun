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

// ── Paginación por id (sin updated_at) ───────────────────────────────────

describe('BodegaDetailPage — paginación con cursor solo por id', () => {
  // ── Test 1: searchParams incluye cursorId, NO incluye cursor ────────────
  it('CONTRATO: searchParams debe incluir cursorId y NO debe incluir "cursor" sin "Id"', () => {
    const content = readPage()
    expect(content).toMatch(/cursorId\??\s*:\s*string/)
    // El searchParams NO debe tener "cursor:" sin "Id"
    const searchParamsBlock = content.match(/searchParams\s*:\s*Promise<\{([^}]+)\}>/)?.[1] ?? ''
    expect(searchParamsBlock).not.toMatch(/\bcursor\s*\?/)
  })

  // ── Test 2: cursor usa p.id < cursorId::uuid (producto, no stock) ──────
  it('CONTRATO: queries con cursor deben usar p.id < cursorId::uuid', () => {
    const content = readPage()
    expect(content).toMatch(/p\.id\s*<\s*\$\{cursorId\}::uuid/)
  })

  // ── Test 3: NO debe persistir el patrón antiguo updated_at < cursor ──────
  it('CONTRATO: NO debe persistir el patrón antiguo "updated_at < cursor"', () => {
    const content = readPage()
    const hasOldCursorPattern = content.match(
      /updated_at\s*<\s*\$\{cursor[^I]/
    )
    expect(hasOldCursorPattern).toBeNull()
  })

  // ── Test 4: lastId se computa, lastUpdated NO ────────────────────────────
  it('CONTRATO: debe computar lastId y NO debe existir lastUpdated', () => {
    const content = readPage()
    expect(content).toMatch(/lastId\s*=|productos\[productos\.length\s*-\s*1\]\.id/)
    expect(content).not.toMatch(/lastUpdated/)
  })

  // ── Test 5: cursorParam solo tiene cursorId ──────────────────────────────
  it('CONTRATO: cursorParam debe incluir solo &cursorId= sin &cursor= suelto', () => {
    const content = readPage()
    expect(content).toMatch(/cursorParam/)
    // cursorParam debe contener cursorId y NO contener "&cursor=" (sin Id)
    const cursorParamBlock = content.match(/cursorParam\s*=\s*[^;]+/)
    const cursorParamValue = cursorParamBlock?.[0] ?? ''
    expect(cursorParamValue).toMatch(/cursorId/)
    expect(cursorParamValue).not.toMatch(/[&?]cursor=[^I]/)
  })

  // ── Test 6: cursorId se extrae de searchParams ──────────────────────────
  it('CONTRATO: debe desestructurar cursorId desde searchParams', () => {
    const content = readPage()
    expect(content).toMatch(/cursorId\s*[,:}=]/)
  })

  // ── Test 7: ORDER BY usa p.id DESC (producto, no stock) ──────────────────
  it('CONTRATO: ORDER BY debe usar p.id DESC en vez de s.id o s.updated_at', () => {
    const content = readPage()
    expect(content).toMatch(/p\.id\s+DESC/)
    expect(content).not.toMatch(/s\.id\s+DESC/)
    expect(content).not.toMatch(/s\.updated_at\s+DESC/)
  })
})

// ── Smoke: componente BodegaProductList ──────────────────────────────────

describe('BodegaProductList — soporte cursor solo por id', () => {
  // ── Test 8: Props incluyen cursorId, NO lastUpdated ni cursorParam ──────
  it('CONTRATO: Props deben incluir cursorId y NO lastUpdated ni cursorParam', () => {
    const listContent = readList()
    expect(listContent).toMatch(/cursorId\s*:\s*(string\s*\|\s*null)/)
    expect(listContent).not.toMatch(/lastUpdated/)
    expect(listContent).not.toMatch(/cursorParam/)
  })

  // ── Test 9: link "Cargar más" usa solo cursorId ─────────────────────────
  it('CONTRATO: el link "Cargar más" debe usar solo ?cursorId= en el href', () => {
    const listContent = readList()
    expect(listContent).toMatch(/cursorId/)
    expect(listContent).toMatch(/href.*cursorId/)
    // No debe tener "cursor=" (sin Id) en el href
    const hrefMatch = listContent.match(/href=\{`[^`]+`\}/)
    const hrefValue = hrefMatch?.[0] ?? ''
    expect(hrefValue).not.toMatch(/\?cursor=[^I]/)
  })

  // ── Test 10: condición del link solo requiere hasMore && cursorId ───────
  it('CONTRATO: el link debe mostrarse con hasMore && cursorId (sin lastUpdated)', () => {
    const listContent = readList()
    expect(listContent).toMatch(/hasMore\s*&&\s*cursorId/)
    expect(listContent).not.toMatch(/lastUpdated/)
  })
})
