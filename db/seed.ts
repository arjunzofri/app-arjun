import { db } from "./index";
import { bodegas, modulosDestino, usuarios, productos, stock } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding started...");

  // 1. Bodegas
  const bodegasData = [
    { nombre: "Bodega 1 Vida Digital", descripcion: "Almacén principal Vida Digital 1" },
    { nombre: "Bodega 2 Vida Digital", descripcion: "Almacén principal Vida Digital 2" },
    { nombre: "Bodega Arjun", descripcion: "Bodega propia Arjun" },
  ];
  const insertedBodegas = await db.insert(bodegas).values(bodegasData).returning();

  // 2. Módulos de destino
  const modulosData = [
    { nombre: "Módulo 180" },
    { nombre: "Módulo 182" },
    { nombre: "Módulo 183" },
    { nombre: "Módulo 184" },
    { nombre: "Módulo 193" },
  ];
  await db.insert(modulosDestino).values(modulosData);

  // 3. Usuario Admin
  const passwordHash = await bcrypt.hash("arjun2025", 10);
  const [adminUser] = await db.insert(usuarios).values({
    nombre: "Admin Arjun",
    email: "admin@arjun.cl",
    passwordHash,
    rol: "admin",
  }).returning();

  // 4. Productos de ejemplo
  const productosData = [
    { codigo: "K-001", descripcion: "Cargador Rápido 20W", codigoPersonal: "CHARGER-20W", packing: 50, ubicacion: "Sector A1" },
    { codigo: "K-002", descripcion: "Audífonos Bluetooth Pro", codigoPersonal: "EAR-PRO", packing: 20, ubicacion: "Sector B2" },
    { codigo: "K-003", descripcion: "Smartwatch v5", codigoPersonal: "WATCH-V5", packing: 10, ubicacion: "Sector C3" },
    { codigo: "K-004", descripcion: "Cable Lightning 1m", codigoPersonal: "CABLE-L1", packing: 100, ubicacion: "Sector A1" },
    { codigo: "K-005", descripcion: "Powerbank 10000mAh", codigoPersonal: "PB-10K", packing: 15, ubicacion: "Sector D4" },
  ];
  const insertedProductos = await db.insert(productos).values(productosData).returning();

  // 5. Stock inicial para los productos en Bodega Arjun
  const stockData = insertedProductos.map(p => ({
    productoId: p.id,
    bodegaId: insertedBodegas[2].id, // Bodega Arjun
    cantidadActual: 100,
  }));
  await db.insert(stock).values(stockData);

  console.log("Seeding finished successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
