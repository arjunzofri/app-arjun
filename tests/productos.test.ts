import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrUpdateProducto } from "../lib/actions";
import { db } from "../db";
import { productos } from "../db/schema";
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
    insertActivityLog: vi.fn(),
  },
}));

vi.mock("../db/schema", () => ({
  productos: { id: "id", codigo: "codigo" },
  activityLog: { id: "id" },
}));

vi.mock("../lib/auth", () => ({
  auth: vi.fn(),
}));

describe("Heredar Ubicación", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe heredar la ubicación si el código ya existe y el nuevo no tiene ubicación", async () => {
    (auth as any).mockResolvedValue({ user: { id: "user-1" } });
    
    // Mock existing product with location
    (db.query.productos.findFirst as any).mockResolvedValue({
      codigo: "EXISTENTE",
      ubicacion: "PASILLO-1",
    });

    const newData = {
      codigo: "EXISTENTE",
      descripcion: "Producto Importado",
      packing: 1,
      // ubicacion is missing
    };

    const result = await createOrUpdateProducto(newData);

    expect(result?.ubicacion).toBe("PASILLO-1");
  });
});
