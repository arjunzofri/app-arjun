import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_PRODUCTO_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const TEST_MODULO_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
const TEST_BODEGA_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

// Mock neon().transaction()
const mockTransaction = vi.fn().mockResolvedValue([]);
const mockSqlTag = vi.fn(() => `[SQL_QUERY]`);
(mockSqlTag as any).transaction = mockTransaction;
const mockNeonFn = vi.fn(() => mockSqlTag);

vi.mock("@neondatabase/serverless", () => ({
  neon: mockNeonFn,
}));

// Mock db query methods — configurables por test
const mockStockModulosFindFirst = vi.fn();
const mockSalidasFindFirst = vi.fn();
const mockStockFindFirst = vi.fn();

const mockInsertActivity = vi.fn();
const mockDelete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/db", () => ({
  db: {
    query: {
      stockModulos: { findFirst: mockStockModulosFindFirst },
      salidas: { findFirst: mockSalidasFindFirst },
      stock: { findFirst: mockStockFindFirst },
      productos: { findFirst: vi.fn().mockResolvedValue(null) },
      usuarios: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: vi.fn(() => ({ values: mockInsertActivity })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: mockDelete,
    select: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("editarStockModulo — ajuste de stock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgresql://fake";
  });

  it("diferencia > 0: devuelve unidades a bodega origen", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    mockStockModulosFindFirst.mockResolvedValue({
      id: "sm-1",
      productoId: TEST_PRODUCTO_ID,
      moduloId: TEST_MODULO_ID,
      cantidadAcumulada: 100,
    });
    mockSalidasFindFirst.mockResolvedValue({
      id: "salida-1",
      bodegaOrigenId: TEST_BODEGA_ID,
    });
    mockStockFindFirst.mockResolvedValue({
      id: "stock-1",
      cantidadActual: 200,
    });

    const { editarStockModulo } = await import("../lib/actions");
    const result = await editarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID, {
      cantidadAcumulada: 75,
    });

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalled();
    // El array de queries debe contener UPDATE stock_modulos, UPDATE stock, INSERT activity_log
    const queries = mockTransaction.mock.calls[0][0];
    expect(queries.length).toBeGreaterThanOrEqual(3);
  });

  it("diferencia < 0: resta unidades de bodega origen", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    mockStockModulosFindFirst.mockResolvedValue({
      id: "sm-2",
      cantidadAcumulada: 50,
    });
    mockSalidasFindFirst.mockResolvedValue({
      id: "salida-2",
      bodegaOrigenId: TEST_BODEGA_ID,
    });
    mockStockFindFirst.mockResolvedValue({
      id: "stock-2",
      cantidadActual: 200,
    });

    const { editarStockModulo } = await import("../lib/actions");
    const result = await editarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID, {
      cantidadAcumulada: 80,
    });

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("diferencia < 0 con stock insuficiente: retorna error", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    mockStockModulosFindFirst.mockResolvedValue({
      id: "sm-3",
      cantidadAcumulada: 50,
    });
    mockSalidasFindFirst.mockResolvedValue({
      id: "salida-3",
      bodegaOrigenId: TEST_BODEGA_ID,
    });
    mockStockFindFirst.mockResolvedValue({
      id: "stock-3",
      cantidadActual: 10,
    });

    const { editarStockModulo } = await import("../lib/actions");
    const result = await editarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID, {
      cantidadAcumulada: 100,
    });

    expect(result).toEqual({
      error: expect.stringContaining("Stock insuficiente"),
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("sin salida registrada: retorna error y no modifica nada", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    mockStockModulosFindFirst.mockResolvedValue({
      id: "sm-4",
      cantidadAcumulada: 50,
    });
    mockSalidasFindFirst.mockResolvedValue(null);

    const { editarStockModulo } = await import("../lib/actions");
    const result = await editarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID, {
      cantidadAcumulada: 75,
    });

    expect(result).toEqual({
      error: "No se encontró bodega origen para ajustar el stock",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe("eliminarStockModulo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe rechazar si el usuario no es admin", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-2", role: "operador" } });

    const { eliminarStockModulo } = await import("../lib/actions");

    const result = await eliminarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID);
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Solo administradores");
  });

  it("debe eliminar el registro y escribir en activity_log si es admin", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    mockStockModulosFindFirst.mockResolvedValue({
      id: "sm-9",
      productoId: TEST_PRODUCTO_ID,
      moduloId: TEST_MODULO_ID,
      cantidadAcumulada: 30,
    });

    const { eliminarStockModulo } = await import("../lib/actions");

    await eliminarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID);

    expect(mockDelete).toHaveBeenCalled();

    expect(mockInsertActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "STOCK_MODULO_ELIMINADO",
        tablaAfectada: "stock_modulos",
      })
    );
  });
});
