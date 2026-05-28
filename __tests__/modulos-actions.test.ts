import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_PRODUCTO_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const TEST_MODULO_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

const mockInsertActivity = vi.fn();
const mockInsertValues = vi.fn(() => ({
  returning: vi.fn().mockResolvedValue([{ id: "log-id" }]),
}));

const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

vi.mock("@/db", () => ({
  db: {
    query: {
      stockModulos: {
        findFirst: vi.fn().mockResolvedValue({
          id: "sm-1",
          productoId: TEST_PRODUCTO_ID,
          moduloId: TEST_MODULO_ID,
          cantidadAcumulada: 50,
        }),
      },
      productos: { findFirst: vi.fn().mockResolvedValue(null) },
      usuarios: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: vi.fn(() => ({
      values: mockInsertActivity,
    })),
    update: vi.fn(() => ({ set: mockUpdateSet })),
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

describe("editarStockModulo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe actualizar cantidadAcumulada y registrar en activity_log con valorAnterior y valorNuevo", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    const { editarStockModulo } = await import("../lib/actions");

    await editarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID, {
      cantidadAcumulada: 75,
    });

    const { db } = await import("@/db");

    // Debe hacer UPDATE en stock_modulos
    expect(db.update).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalled();
    expect(mockUpdateWhere).toHaveBeenCalled();

    // Debe escribir en activity_log con payload que incluya valorAnterior y valorNuevo
    expect(mockInsertActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "STOCK_MODULO_EDITADO",
        tablaAfectada: "stock_modulos",
        detalle: expect.objectContaining({
          productoId: TEST_PRODUCTO_ID,
          moduloId: TEST_MODULO_ID,
          valorAnterior: 50,
          valorNuevo: 75,
        }),
      })
    );
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

    await expect(
      eliminarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID)
    ).rejects.toThrow("Solo administradores");
  });

  it("debe eliminar el registro y escribir en activity_log si es admin", async () => {
    const { auth } = await import("@/lib/auth");
    (auth as any).mockResolvedValue({ user: { id: "user-1", role: "admin" } });

    const { eliminarStockModulo } = await import("../lib/actions");

    await eliminarStockModulo(TEST_PRODUCTO_ID, TEST_MODULO_ID);

    const { db } = await import("@/db");

    expect(mockDelete).toHaveBeenCalled();

    expect(mockInsertActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: "STOCK_MODULO_ELIMINADO",
        tablaAfectada: "stock_modulos",
      })
    );
  });
});
