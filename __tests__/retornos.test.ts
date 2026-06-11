import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function read(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf-8") : "";
}

// ============================================================
// IDs de prueba
// ============================================================
const TEST_PRODUCTO_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const TEST_MODULO_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
const TEST_BODEGA_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

// ============================================================
// db/schema.ts — tabla retornos
// ============================================================

describe("Schema — tabla retornos", () => {
  const schemaPath = join(process.cwd(), "db", "schema.ts");

  it("debe exportar la tabla retornos", () => {
    expect(read(schemaPath)).toContain("export const retornos");
  });

  it("retornos debe tener productoId FK a productos", () => {
    const c = read(schemaPath);
    expect(c).toContain("productoId");
    // La FK está en la misma definición de columna
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toContain("references(() => productos.id)");
  });

  it("retornos debe tener moduloOrigenId FK a modulos_destino", () => {
    const c = read(schemaPath);
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toContain("moduloOrigenId");
    expect(retornoSection).toContain("references(() => modulosDestino.id)");
  });

  it("retornos debe tener bodegaDestinoId FK a bodegas", () => {
    const c = read(schemaPath);
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toContain("bodegaDestinoId");
    expect(retornoSection).toContain("references(() => bodegas.id)");
  });

  it("retornos debe tener campo cantidad integer notNull", () => {
    const c = read(schemaPath);
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toMatch(/cantidad.*integer.*notNull/);
  });

  it("retornos debe tener usuarioId FK a usuarios", () => {
    const c = read(schemaPath);
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toContain("references(() => usuarios.id)");
  });

  it("retornos debe tener observaciones text", () => {
    const c = read(schemaPath);
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toContain("observaciones");
  });

  it("retornos debe tener createdAt timestamp", () => {
    const c = read(schemaPath);
    const retornoSection = c.split("export const retornos")[1]?.split("export const activityLog")[0] ?? "";
    expect(retornoSection).toContain("createdAt");
  });

  it("debe haber retornosRelations exportada", () => {
    expect(read(schemaPath)).toContain("export const retornosRelations");
  });

  it("productoRelations debe incluir retornos", () => {
    const c = read(schemaPath);
    const prodRelSection = c.split("export const productoRelations")[1]?.split("export const retornosRelations")[0] ?? "";
    expect(prodRelSection).toContain("retornos: many(retornos)");
  });
});

// ============================================================
// Migration SQL
// ============================================================

describe("Migration — add_retornos.sql", () => {
  const migPath = join(process.cwd(), "db", "migrations", "0001_add_retornos.sql");

  it("debe existir el archivo de migración", () => {
    expect(existsSync(migPath)).toBe(true);
  });

  it("debe crear tabla public.retornos", () => {
    expect(read(migPath)).toContain("CREATE TABLE public.retornos");
  });

  it("debe tener CHECK (cantidad > 0)", () => {
    expect(read(migPath)).toMatch(/CHECK.*cantidad.*>.*0/);
  });

  it("debe tener FK a productos, modulos_destino, bodegas, usuarios", () => {
    const c = read(migPath);
    expect(c).toContain("REFERENCES public.productos");
    expect(c).toContain("REFERENCES public.modulos_destino");
    expect(c).toContain("REFERENCES public.bodegas");
    expect(c).toContain("REFERENCES public.usuarios");
  });

  it("debe tener observaciones TEXT", () => {
    expect(read(migPath)).toContain("observaciones TEXT");
  });

  it("debe tener created_at TIMESTAMPTZ DEFAULT NOW()", () => {
    expect(read(migPath)).toContain("created_at TIMESTAMPTZ DEFAULT NOW()");
  });
});

// ============================================================
// API POST /api/retornos
// ============================================================

describe("API POST /api/retornos", () => {
  const apiPath = join(process.cwd(), "app", "api", "retornos", "route.ts");

  it("debe existir el archivo de ruta", () => {
    expect(existsSync(apiPath)).toBe(true);
  });

  it("debe exportar función POST", () => {
    expect(read(apiPath)).toMatch(/export.*function.*POST/);
  });

  it("debe validar cantidad > 0", () => {
    const c = read(apiPath);
    expect(c).toMatch(/cant\s*[<>=]+\s*0|cantidad\s*[<>=]+\s*0/);
  });

  it("debe validar campos requeridos: productoId, moduloOrigenId, bodegaDestinoId, cantidad", () => {
    const c = read(apiPath);
    expect(c).toContain("productoId");
    expect(c).toContain("moduloOrigenId");
    expect(c).toContain("bodegaDestinoId");
  });

  it("debe verificar stock suficiente en módulo", () => {
    const c = read(apiPath);
    expect(c).toMatch(/cantidad_acumulada|cantidadAcumulada/);
    expect(c).toMatch(/stock.*insuficiente|Stock insuficiente/);
  });

  it("debe hacer UPDATE stock_modulos restando cantidad", () => {
    const c = read(apiPath);
    expect(c).toContain("stock_modulos");
    expect(c).toContain("cantidad_acumulada -");
  });

  it("debe hacer UPSERT en stock sumando cantidad", () => {
    const c = read(apiPath);
    expect(c).toContain("ON CONFLICT (producto_id, bodega_id)");
    expect(c).toContain("cantidad_actual +");
  });

  it("debe hacer INSERT INTO retornos", () => {
    expect(read(apiPath)).toContain("retornos");
  });

  it("debe retornar { ok: true } en éxito", () => {
    expect(read(apiPath)).toContain("ok");
  });

  it("debe escribir en activity_log con RETORNO_REGISTRADO", () => {
    expect(read(apiPath)).toContain("RETORNO_REGISTRADO");
  });
});

// ============================================================
// RetornoModal component
// ============================================================

describe("RetornoModal component", () => {
  const modalPath = join(process.cwd(), "components", "modulos", "RetornoModal.tsx");

  it("debe existir el componente", () => {
    expect(existsSync(modalPath)).toBe(true);
  });

  it('debe ser "use client"', () => {
    expect(read(modalPath)).toContain('"use client"');
  });

  it("debe importar NumericInput", () => {
    expect(read(modalPath)).toContain("NumericInput");
  });

  it("debe tener select de producto", () => {
    const c = read(modalPath);
    expect(c).toMatch(/select|Select/);
    expect(c).toContain("productoId");
  });

  it("debe filtrar productos con cantidadAcumulada > 0", () => {
    const c = read(modalPath);
    expect(c).toContain("cantidadAcumulada");
  });

  it("debe tener select de bodega destino", () => {
    const c = read(modalPath);
    expect(c).toContain("bodegaDestinoId");
  });

  it("debe tener input de cantidad con max = stock disponible", () => {
    const c = read(modalPath);
    expect(c).toContain("stockDisponible");
  });

  it("debe hacer POST a /api/retornos", () => {
    expect(read(modalPath)).toContain("/api/retornos");
  });

  it("debe tener scroll lock en body", () => {
    expect(read(modalPath)).toContain("document.body.style.overflow");
  });

  it("debe retornar null cuando open es false", () => {
    expect(read(modalPath)).toContain("if (!open) return null");
  });
});

// ============================================================
// RetornoButton component
// ============================================================

describe("RetornoButton component", () => {
  const buttonPath = join(process.cwd(), "components", "modulos", "RetornoButton.tsx");

  it("debe existir el componente", () => {
    expect(existsSync(buttonPath)).toBe(true);
  });

  it('debe ser "use client"', () => {
    expect(read(buttonPath)).toContain('"use client"');
  });

  it("debe importar RetornoModal", () => {
    expect(read(buttonPath)).toContain("RetornoModal");
  });

  it("debe tener botón con texto Retornar mercadería", () => {
    expect(read(buttonPath)).toContain("Retornar mercadería");
  });

  it("debe deshabilitar botón si no hay productos con stock", () => {
    expect(read(buttonPath)).toContain("productos.length === 0");
  });

  it("debe pasar key prop al modal para reset en cada apertura", () => {
    expect(read(buttonPath)).toContain("retorno-open");
  });
});

// ============================================================
// Modulo detail page — integración
// ============================================================

describe("Modulo detail — botón Retornar", () => {
  const pagePath = join(process.cwd(), "app", "(dashboard)", "modulos", "[moduloId]", "page.tsx");

  it("debe importar RetornoButton", () => {
    expect(read(pagePath)).toContain("RetornoButton");
  });

  it("debe cargar bodegas con findMany", () => {
    expect(read(pagePath)).toContain("bodegas.findMany");
  });

  it("debe pasar moduloId como prop a RetornoButton", () => {
    const c = read(pagePath);
    expect(c).toContain("moduloId={moduloId}");
  });

  it("debe mapear productos con campos requeridos para el modal", () => {
    const c = read(pagePath);
    expect(c).toContain("cantidadAcumulada:");
    expect(c).toContain("packing:");
  });

  it("debe pasar bodegas como prop a RetornoButton", () => {
    expect(read(pagePath)).toContain("bodegas={allBodegas}");
  });
});

// ============================================================
// Server action — registrarRetorno (integración con mocks)
// ============================================================

const mockTransaction = vi.fn().mockResolvedValue([]);
const mockSqlTag = vi.fn(() => `[SQL_QUERY]`);
(mockSqlTag as any).transaction = mockTransaction;
const mockNeonFn = vi.fn(() => mockSqlTag);

vi.mock("@neondatabase/serverless", () => ({
  neon: mockNeonFn,
}));

const mockInsertActivity = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      stockModulos: { findFirst: vi.fn() },
      salidas: { findFirst: vi.fn() },
      stock: { findFirst: vi.fn() },
      productos: { findFirst: vi.fn().mockResolvedValue(null) },
      usuarios: { findFirst: vi.fn().mockResolvedValue(null) },
      bodegas: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: vi.fn(() => ({ values: mockInsertActivity })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
    select: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("registrarRetorno — server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgresql://fake";
  });

  it("debe rechazar si el usuario no está autenticado", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue(null);

    const { registrarRetorno } = await import("../lib/actions");
    const result = await registrarRetorno({
      productoId: TEST_PRODUCTO_ID,
      moduloOrigenId: TEST_MODULO_ID,
      bodegaDestinoId: TEST_BODEGA_ID,
      cantidad: 5,
    });

    expect(result).toEqual({ error: "No autorizado" });
  });

  it("debe rechazar datos inválidos (cantidad negativa)", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "operador" } });

    const { registrarRetorno } = await import("../lib/actions");
    const result = await registrarRetorno({
      productoId: TEST_PRODUCTO_ID,
      moduloOrigenId: TEST_MODULO_ID,
      bodegaDestinoId: TEST_BODEGA_ID,
      cantidad: -3,
    });

    expect(result).toEqual({ error: "Datos inválidos" });
  });

  it("debe retornar error si stock_modulos es insuficiente", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "operador" } });

    // Mock neon para devolver cantidad_acumulada baja
    const mockSql = vi.fn();
    mockSql.mockResolvedValueOnce([{ cantidad_acumulada: 2 }]); // solo 2 disponible
    mockNeonFn.mockReturnValue(mockSql);

    const { registrarRetorno } = await import("../lib/actions");
    const result = await registrarRetorno({
      productoId: TEST_PRODUCTO_ID,
      moduloOrigenId: TEST_MODULO_ID,
      bodegaDestinoId: TEST_BODEGA_ID,
      cantidad: 10,
    });

    expect(result).toEqual({
      error: expect.stringContaining("Stock insuficiente en módulo"),
    });
  });

  it("debe ejecutar CTE atómica y escribir activity_log en éxito", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "operador" } });

    const mockRetornoId = "ret-123";
    const mockSql = vi.fn();
    // Primera llamada: lectura previa
    mockSql.mockResolvedValueOnce([{ cantidad_acumulada: 100 }]);
    // Segunda llamada: CTE — retorna el retorno insertado
    mockSql.mockResolvedValueOnce([{ id: mockRetornoId }]);
    mockNeonFn.mockReturnValue(mockSql);

    const { registrarRetorno } = await import("../lib/actions");
    const result = await registrarRetorno({
      productoId: TEST_PRODUCTO_ID,
      moduloOrigenId: TEST_MODULO_ID,
      bodegaDestinoId: TEST_BODEGA_ID,
      cantidad: 10,
    });

    expect(result).toHaveProperty("id", mockRetornoId);
    expect(mockInsertActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "RETORNO_REGISTRADO",
        tablaAfectada: "retornos",
      })
    );
  });
});
