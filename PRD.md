# PRD.md — App Arjun v2.0

**Director Técnico:** Claude  
**Product Owner:** Pablo  
**Programador:** Claude Code  
**Fecha:** Mayo 2026  

---

## 1. Descripción del Proyecto

App Arjun es un sistema de control de inventario para la empresa Arjun (Mall Zofri, Iquique).
Gestiona stock entre 3 bodegas de origen y 5 módulos de venta en el mall.

Esta versión (v2) parte el inventario desde cero con ingreso manual de productos.
WinFac de Arjun se usa exclusivamente como buscador/autocompletado al crear productos,
no como fuente de stock histórico. La sincronización automática futura (post corte) solo
afectará ingresos nuevos desde la fecha que Pablo defina.

---

## 2. Entidades del Negocio

**Bodegas (origen):**
- Bodega 1 Vida Digital
- Bodega 2 Vida Digital
- Bodega Arjun

**Módulos destino (Mall Zofri):**
- Módulo 180, 182, 183, 184, 193

---

## 3. Stack Técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | React 19 |
| CSS | Tailwind CSS v4 (@tailwindcss/postcss) |
| TypeScript | 5.9 |
| ORM | Drizzle ORM ^0.45 |
| Base de datos | Neon PostgreSQL (serverless) |
| Auth | NextAuth v5 beta — login username + password |
| Tests | Vitest ^4.1 |
| Deploy | Vercel (push a main) |
| Imágenes | Cloudinary (cuenta Arjun) |

---

## 4. Schema de Base de Datos

### Schema `public` (App Arjun)

```sql
-- Catálogo de productos
productos
  id              UUID PK
  codigo          TEXT                          -- código WinFac o manual
  descripcion     TEXT
  codigoPersonal  TEXT                          -- alias humano
  packing         INT DEFAULT 1
  ubicacion       TEXT                          -- bodega persistente
  observaciones   TEXT
  origenWinfac    BOOLEAN DEFAULT false         -- true si vino del buscador WinFac
  knumezet        TEXT UNIQUE NULLABLE          -- solo si viene de WinFac
  createdAt       TIMESTAMPTZ
  updatedAt       TIMESTAMPTZ

-- Stock por bodega
stock
  id              UUID PK
  productoId      UUID FK → productos
  bodegaId        UUID FK → bodegas
  cantidadActual  INT DEFAULT 0
  updatedAt       TIMESTAMPTZ

-- Stock por módulo (acumulado de salidas)
stock_modulos
  id              UUID PK
  productoId      UUID FK → productos
  moduloId        UUID FK → modulos_destino
  cantidadAcumulada INT DEFAULT 0              -- suma histórica de salidas hacia este módulo
  updatedAt       TIMESTAMPTZ

-- Ventas en módulo (feature-flag: modulos_ventas) — apagado por defecto
ventas_modulo
  id              UUID PK
  productoId      UUID FK → productos
  moduloId        UUID FK → modulos_destino
  cantidad        INT
  usuarioId       UUID FK → usuarios
  timestampVenta  TIMESTAMPTZ
  observaciones   TEXT

-- Entradas de inventario
entradas
  id              UUID PK
  productoId      UUID FK → productos
  bodegaId        UUID FK → bodegas
  cantidad        INT
  precioUnitario  NUMERIC(12,2) NULLABLE
  usuarioId       UUID FK → usuarios
  origen          ENUM('manual', 'conteo_fisico', 'winfac_futuro')
  observaciones   TEXT
  createdAt       TIMESTAMPTZ

-- Salidas (despachos bodega → módulo)
salidas
  id              UUID PK
  productoId      UUID FK → productos
  bodegaOrigenId  UUID FK → bodegas
  moduloDestinoId UUID FK → modulos_destino
  cantidad        INT
  usuarioId       UUID FK → usuarios
  timestampSalida TIMESTAMPTZ
  observaciones   TEXT

-- Catálogos fijos
bodegas             id UUID PK, nombre TEXT, activa BOOLEAN
modulos_destino     id UUID PK, nombre TEXT, numero INT, activo BOOLEAN

-- Usuarios
usuarios
  id              UUID PK
  nombre          TEXT
  username        TEXT UNIQUE
  email           TEXT
  passwordHash    TEXT
  rol             ENUM('admin', 'operador')
  activo          BOOLEAN DEFAULT true
  createdAt       TIMESTAMPTZ

-- Imágenes de productos
producto_imagenes
  id              UUID PK
  productoId      UUID FK → productos
  url             TEXT
  cloudinaryPublicId TEXT
  createdAt       TIMESTAMPTZ

-- Auditoría completa
activity_log
  id              UUID PK
  usuarioId       UUID FK NULLABLE
  accion          TEXT                          -- 'entrada.crear', 'salida.crear', 'producto.editar', etc.
  entidadTipo     TEXT                          -- 'producto', 'entrada', 'salida', etc.
  entidadId       UUID NULLABLE
  payload         JSONB                         -- snapshot del cambio
  ip              TEXT NULLABLE
  createdAt       TIMESTAMPTZ

-- Feature flags
feature_flags
  id              UUID PK
  nombre          TEXT UNIQUE
  activo          BOOLEAN DEFAULT false
  descripcion     TEXT
  updatedAt       TIMESTAMPTZ
```

### Schema `arjun` (datos crudos WinFac — solo lectura para autocompletado)

```
arjun.inv_sdo   — fuente del buscador: codigo, descripcion, packing, knumezet
```

---

## 5. Arquitectura de Rutas

```
app/
  (auth)/
    login/                  — login username + password

  (dashboard)/
    page.tsx                — Dashboard: resumen stock x bodega, despachos x módulo
    
    bodegas/                — [NUEVA] reemplaza /productos en desktop y móvil
      page.tsx              — selector de bodega → productos de esa bodega (lazy loader)
      [bodegaId]/page.tsx   — lista de productos en bodega específica
    
    modulos/                — [NUEVA] equivalente de bodegas pero para módulos
      page.tsx              — selector de módulo → mercadería acumulada
      [moduloId]/page.tsx   — lista de productos en módulo específico
    
    entradas/               — [REHECHO] flujo minimalista móvil-first
      page.tsx              — EntradasShell (tabs: Nuevo Ingreso / Historial)
    
    salidas/                — [EXISTENTE, ajustes menores]
      page.tsx              — SalidasShell (tabs: Nuevo Despacho / Historial)
    
    usuarios/               — gestión usuarios (solo admin)
      page.tsx

  api/
    productos/
      buscar/               — GET búsqueda en arjun.inv_sdo (autocompletado)
      [id]/
        imagenes/           — POST subir foto a Cloudinary
        historial/          — GET historial completo de movimientos del producto
    sync/
      winfac/               — GET sync futuro (desactivado en fase 1)
```

---

## 6. Backlog Priorizado

### Fase 1 — MVP v2 (este sprint)

#### Slice 1 — Reset de inventario + buscador WinFac
- Migración: limpiar tablas stock, entradas (mantener schema, vaciar datos)
- Endpoint GET /api/productos/buscar: busca en arjun.inv_sdo por codigo o descripcion
- Devuelve: codigo, descripcion, packing, knumezet (máximo 20 resultados)

#### Slice 2 — Entradas móvil (flujo minimalista)
- /entradas en móvil: input-text con autocompletado en tiempo real desde /api/productos/buscar
- Si el operario selecciona de la lista: usa ese producto (crea en public.productos si no existe)
- Si no selecciona nada: registra como producto nuevo manual
- Campos: producto, bodega destino, cantidad, precio unitario (opcional), foto
- Foto: cámara en móvil, archivo en desktop
- Guarda en: public.productos (si nuevo) + stock + entradas + activity_log
- UX inputs numéricos: click borra el 0, sin dígitos colgados a izquierda

#### Slice 3 — Entradas desktop (refactor)
- Mismo flujo que móvil, misma lógica, mismo componente reutilizado
- Tabs: Nuevo Ingreso / Historial de entradas
- Botón editar producto: modal con todos los campos + opción eliminar
- Solo admin puede eliminar

#### Slice 4 — Historial de producto (modal/drawer)
- Accesible desde: imagen o detalles del producto en /salidas y /entradas
- Contenido: todos los movimientos (entradas + salidas), fecha, hora, cantidad,
  origen → destino, operario que registró
- Lazy loader (paginado, 20 por página)

#### Slice 5 — Sección Bodegas
- /bodegas: selector de las 3 bodegas
- Al seleccionar una bodega: lista de productos con stock > 0 en esa bodega
- Lazy loader (20 por página), búsqueda local por nombre/código
- Igual en móvil y desktop

#### Slice 6 — Sección Módulos
- /modulos: selector de los 5 módulos
- Al seleccionar un módulo: lista de productos con cantidadAcumulada > 0
- Acumulado histórico de salidas hacia ese módulo
- Feature flag 'modulos_ventas' en false: oculta opción de descontar ventas

#### Slice 7 — UX inputs numéricos (fix global)
- En todos los inputs de tipo number: onClick selecciona todo el contenido
- Previene dígitos colgados a la izquierda

#### Slice 8 — Auditoría completa
- Asegurar que activity_log recibe entrada en CADA acción:
  entrada.crear, salida.crear, producto.crear, producto.editar,
  producto.eliminar, usuario.crear, usuario.editar, conteo.fisico
- Vista en /usuarios para admins: log de actividad filtrable por usuario/fecha/acción

### Fase 2 — Post-MVP

- Sync WinFac futuro: solo ingresos desde fecha de corte definida por Pablo
- Feature flag 'modulos_ventas': encender cuando el cliente lo pida
- Módulo IA Kingnex: OCR de notas de venta físicas
- Notificaciones stock bajo
- Exportar reportes CSV/Excel

---

## 7. Reglas de Negocio

1. **Inventario desde cero:** no se carga stock histórico de WinFac. Solo lo que los bodegueros ingresen manualmente.
2. **WinFac como buscador:** arjun.inv_sdo se consulta solo para autocompletado. No modifica stock.
3. **Producto nuevo vs existente:** si el operario selecciona de la lista WinFac, se crea en public.productos con origenWinfac=true. Si escribe libre, origenWinfac=false.
4. **Bodega persistente:** al registrar una entrada o salida, la bodega queda guardada en productos.ubicacion como referencia futura.
5. **Stock módulos:** stock_modulos.cantidadAcumulada solo sube con salidas. No baja hasta que se active feature flag 'modulos_ventas'.
6. **Eliminar producto:** solo rol admin. Requiere que stock = 0 en todas las bodegas.
7. **Auditoría:** toda acción que modifica datos escribe en activity_log con payload JSONB del cambio.
8. **Inputs numéricos:** click en el input selecciona todo. Valor predeterminado vacío o 0 se reemplaza completo al escribir.

---

## 8. Feature Flags

| Flag | Estado inicial | Descripción |
|---|---|---|
| `modulos_ventas` | false | Permite descontar ventas en módulos |
| `sync_winfac_automatico` | false | Sync automático de ingresos nuevos desde WinFac |

---

## 9. Usuarios en Producción

| Nombre | Username | Rol |
|---|---|---|
| Admin | admin | admin |
| Anil | anil | admin |
| Test | test | operador |

---

## 10. Estructura de Carpetas

```
app-arjun/
  app/
    (auth)/login/
    (dashboard)/
      page.tsx
      bodegas/
      modulos/
      entradas/
      salidas/
      usuarios/
    api/
      productos/buscar/
      productos/[id]/imagenes/
      productos/[id]/historial/
      sync/winfac/
  components/
    layout/
    mobile/
    entradas/
    salidas/
    bodegas/
    modulos/
    productos/
    usuarios/
    shared/
      HistorialModal.tsx
      NumericInput.tsx
  lib/
    db/
      schema.ts
      index.ts
    utils/
    actions/
  config/
    feature-flags.json
  drizzle/
  public/
```
