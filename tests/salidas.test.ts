import { describe, it, expect, vi, beforeEach } from "vitest";
import { registrarSalida } from "../lib/actions";
import { auth } from "../lib/auth";

// Mock neon
const mockNeonQuery = vi.fn();
const mockNeonTransaction = vi.fn();
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => Object.assign(mockNeonQuery, { transaction: mockNeonTransaction })),
}));

// Mock db
vi.mock("../db", () => ({
  db: {
    query: {
      stock: { findFirst: vi.fn() },
      stockModulos: { findFirst: vi.fn() },
      bodegas: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

vi.mock("../db/schema", () => ({
  productos: { id: "id" },
  stock: { id: "id" },
  stockModulos: { id: "id" },
  salidas: { id: "id" },
  bodegas: { id: "id" },
  activityLog: { id: "id" },
}));

vi.mock("../lib/auth", () => ({
  auth: vi.fn(),
}));

describe("Validación de Stock en Salidas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar error si la cantidad de salida es mayor al stock disponible", async () => {
    (auth as any).mockResolvedValue({ user: { id: "11111111-1111-4111-8111-111111111111" } });

    // Mock stock query: only 5 available
    mockNeonQuery.mockResolvedValueOnce([{ cantidad_actual: 5 }]);

    const data = {
      productoId: "11111111-1111-4111-8111-111111111111",
      bodegaOrigenId: "22222222-2222-4222-8222-222222222222",
      moduloDestinoId: "33333333-3333-4333-8333-333333333333",
      cantidad: 10,
    };

    const result = await registrarSalida(data);
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Stock insuficiente");
  });
});
