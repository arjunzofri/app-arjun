# PRD — App Arjun Mobile Sprint (v1.0)

## Contexto
App Arjun es una app Next.js 15 existente para control de inventario.
Este sprint agrega una experiencia móvil dedicada para bodegueros.
No es una app separada — es el mismo proyecto con rutas y componentes móviles.

## Usuarios móviles
- Bodeguero: registra salidas, actualiza stock contado, saca fotos de productos
- Condiciones de uso: poca luz, distracciones, manos ocupadas, celular en mano

## Backlog priorizado

### Slice 1 — PWA + navegación móvil (BLOQUEANTE)
- Crear public/manifest.json para instalación como PWA
- Agregar meta tags PWA en app/layout.tsx
- Crear ícono PWA (letra A, fondo #1e3a5f)
- Crear components/layout/MobileNav.tsx — barra inferior fija, solo móvil
  Opciones: Inicio (/), Salidas (/salidas), Stock (/mobile/stock)
- Ocultar sidebar en móvil, agregar pb-16 al main en móvil
- Crear app/(dashboard)/mobile/stock/page.tsx — placeholder

### Slice 2 — Flujo Registrar Salida móvil
- Rediseñar /salidas para móvil: buscador prominente primero
- Resultado de búsqueda: imagen grande + código + descripción corta
- Bodega origen: 3 botones grandes, pre-seleccionar desde productos.ubicacion
- Al confirmar salida: guardar bodega seleccionada en productos.ubicacion
- Módulo destino: 5 botones grandes (180, 182, 183, 184, 193)
- Input cantidad: numérico grande, teclado numérico
- Botón CONFIRMAR prominente verde

### Slice 3 — Flujo Actualizar Stock móvil
- Crear app/(dashboard)/mobile/stock/page.tsx completo
- Buscador igual al de salidas
- Input cantidad con conversión: si tiene packing → mostrar X cajas + Y unidades
- Ejemplo: 25 unidades con packing 6 → "4 cajas + 1 unidad"
- Botón CONFIRMAR prominente

### Slice 4 — Foto de producto desde cámara
- En resultado de búsqueda (móvil), botón "📷 Foto"
- Abre input type="file" accept="image/*" capture="environment"
- Sube a Cloudinary de Arjun con public_id = producto.codigo
- Reemplaza imagen anterior (lógica ya existe en /api/productos/[id]/imagenes)

## Stack
- Next.js 15, React 19, Tailwind CSS v4, TypeScript 5
- Drizzle ORM + Neon PostgreSQL
- NextAuth v5 beta
- Cloudinary (Arjun) para fotos

## Estructura de rutas nuevas
app/(dashboard)/mobile/
  stock/page.tsx       — Actualizar stock

## Componentes nuevos
components/layout/MobileNav.tsx
components/mobile/BuscadorProducto.tsx
components/mobile/BotonesModulo.tsx
components/mobile/InputCantidad.tsx
components/mobile/BotonFoto.tsx

## Comandos
- dev: npm run dev
- build: npm run build
- test: npx vitest run
- lint: npm run lint
