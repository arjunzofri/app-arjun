import { describe, it, expect, vi, beforeEach } from "vitest";
import { registrarSalida } from "../lib/actions";
import { db } from "../db";
import { auth } from "../lib/auth";

vi.mock("../db", () => ({
  db: {
    transaction: vi.fn(async (callback) => await callback({
      query: {
        stock: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => [{ id: "salida-1" }]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock("../lib/auth", () => ({
  auth: vi.fn(),
}));

describe("Validación de Stock en Salidas", () => {
  it("debe fallar si la cantidad de salida es mayor al stock disponible", async () => {
    (auth as any).mockResolvedValue({ user: { id: "user-1" } });

    // Stock returns only 5 units
    const mockTx = {
      query: { stock: { findFirst: vi.fn(() => ({ cantidadActual: 5 })) } }
    };
    
    // We try to take 10
    const data = {
      productoId: "prod-1",
      bodegaOrigenId: "bod-1",
      moduloDestinoId: "mod-1",
      cantidad: 10,
    };

    // Re-mocking transaction to use our mock stock
    (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));

    await expect(registrarSalida(data)).rejects.toThrow("Stock insuficiente");
  });
});
