import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrUpdateProducto } from "../lib/actions";
import { db } from "../db";
import { auth } from "../lib/auth";

// Mock DB and Auth
vi.mock("../db", () => ({
  db: {
    query: {
      productos: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: "new-id", codigo: "EXISTENTE", ubicacion: "PASILLO-1" }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock("../db/schema", () => ({
  productos: { id: "id", codigo: "codigo" },
  activityLog: { id: "id" },
  codigoPersonalAuditoria: { id: "id" },
}));

vi.mock("../lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Heredar Ubicación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe heredar la ubicación si el código ya existe y el nuevo no tiene ubicación", async () => {
    (auth as any).mockResolvedValue({ user: { id: "user-1" } });

    // Mock existing product with location (first findFirst call)
    // Second call returns the updated product (post-update fetch)
    let callCount = 0;
    (db.query.productos.findFirst as any).mockImplementation(() => {
      callCount++;
      return {
        id: "existing-id",
        codigo: "EXISTENTE",
        descripcion: "Producto Importado",
        packing: 1,
        ubicacion: "PASILLO-1",
        codigoPersonal: callCount === 1 ? undefined : undefined,
      };
    });

    const newData = {
      codigo: "EXISTENTE",
      descripcion: "Producto Importado",
      packing: 1,
      // ubicacion is missing
    };

    const result = await createOrUpdateProducto(newData);

    if ("error" in result) throw new Error(`createOrUpdateProducto returned error: ${result.error}`);
    expect(result.ubicacion).toBe("PASILLO-1");
  });
});
