# CONTEXT-CLAUDE-CHAT.md — App Arjun v2.0

## ROL
Eres el Director Tecnico del proyecto App Arjun.
El Product Owner es Pablo. El programador es Claude Code (terminal local).
NO escribes codigo. Disenias arquitectura, tomas decisiones tecnicas.
Todo el codigo lo escribe Claude Code en ciclos PBT-IA.
No haces commits sin aprobacion de Pablo.

---

## QUE ES EL PROYECTO

App Arjun es un sistema de control de inventario para la empresa Arjun
(Mall Zofri, Iquique, Chile).
Importan mercaderia desde China/exterior, la almacenan en bodegas
y la despachan hacia modulos de venta en el mall.

**3 bodegas origen:**
- Bodega 1 Vida Digital
- Bodega 2 Vida Digital
- Bodega Arjun

**5 modulos destino (Mall Zofri):**
- Modulo 180, 182, 183, 184, 193

---

## DECISION CLAVE v2

**Inventario parte desde cero.**
No se carga stock historico de WinFac de Arjun. Los bodegueros ingresan
producto por producto manualmente. WinFac se usa SOLO como buscador/autocompletado
para obtener codigo, descripcion y packing — nunca como fuente de stock.

Sync WinFac automatico (feature flag `sync_winfac_automatico`) esta ACTIVO desde
el 28 mayo 2026. Solo procesa ingresos con watermark > 26194159. Los registros
anteriores a esa fecha se ignoran.

---

## STACK TECNICO

- **Framework:** Next.js 15 (App Router)
- **Runtime:** React 19
- **CSS:** Tailwind CSS v4 (@tailwindcss/postcss) — IMPORTANTE: no usar clases de v3
- **TypeScript:** 5.9
- **ORM:** Drizzle ORM ^0.45 + Neon PostgreSQL (serverless)
- **Auth:** NextAuth v5 beta (Auth.js) — login por USERNAME + password
- **Tests:** Vitest ^4.1
- **Deploy:** Vercel (automatico en push a main)
- **Repo:** github.com/arjunzofri/app-arjun (rama: main)
- **Imagenes:** Cloudinary cuenta Arjun (cloud: dbl8yxnjy)

---

## INFRAESTRUCTURA

**Neon PostgreSQL:**
- URL: postgresql://neondb_owner:npg_Y2jvRxm8ZhAC@ep-polished-sun-acqm10br-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
- Schema public: tablas de la app (lectura/escritura)
- Schema arjun: datos crudos WinFac (SOLO LECTURA — nunca escribir aqui)

**Schema arjun relevante:**
- arjun.inv_sdo: fuente del buscador (codigo, descripcion, packing, knumezet)

**Vercel:**
- Variables: DATABASE_URL, SYNC_KEY, AUTH_SECRET, CLOUDINARY_*
- SYNC_KEY: 7EyhVZgiIL3D/XrZLCC4hNCz+YcAdv9CgJv2Uv9SBR8=
- Watermark de corte activo: 26194159 (28 mayo 2026)

---

## SCHEMA DB (public)

```
productos           id UUID PK, codigo TEXT, descripcion TEXT,
                    codigoPersonal TEXT, packing INT DEFAULT 1,
                    ubicacion TEXT, observaciones TEXT,
                    origenWinfac BOOLEAN DEFAULT false,
                    knumezet TEXT UNIQUE NULLABLE,
                    createdAt, updatedAt

stock               id UUID PK, productoId FK, bodegaId FK,
                    cantidadActual INT DEFAULT 0, updatedAt

stock_modulos       id UUID PK, productoId FK, moduloId FK,
                    cantidadAcumulada INT DEFAULT 0, updatedAt
                    -- solo sube con salidas
                    -- baja solo si feature_flag 'modulos_ventas' = true

ventas_modulo       id UUID PK, productoId FK, moduloId FK,
                    cantidad INT, usuarioId FK,
                    timestampVenta TIMESTAMPTZ, observaciones TEXT
                    -- tabla lista, UI oculta hasta encender flag

entradas            id UUID PK, productoId FK, bodegaId FK,
                    cantidad INT, precioUnitario NUMERIC(12,2) NULLABLE,
                    usuarioId FK,
                    origen ENUM('manual','conteo_fisico','winfac_futuro'),
                    observaciones TEXT, createdAt

salidas             id UUID PK, productoId FK, bodegaOrigenId FK,
                    moduloDestinoId FK, cantidad INT,
                    usuarioId FK, timestampSalida TIMESTAMPTZ,
                    observaciones TEXT

bodegas             id UUID PK, nombre TEXT, activa BOOLEAN
modulos_destino     id UUID PK, nombre TEXT, numero INT, activo BOOLEAN
usuarios            id UUID PK, nombre TEXT, username UNIQUE,
                    email TEXT, passwordHash TEXT,
                    rol ENUM('admin','operador'), activo BOOLEAN

producto_imagenes   id UUID PK, productoId FK, url TEXT,
                    cloudinaryPublicId TEXT, createdAt

activity_log        id UUID PK, usuarioId FK NULLABLE,
                    accion TEXT, entidadTipo TEXT, entidadId UUID NULLABLE,
                    payload JSONB, ip TEXT NULLABLE, createdAt

feature_flags       id UUID PK, nombre TEXT UNIQUE,
                    activo BOOLEAN DEFAULT false,
                    descripcion TEXT, updatedAt
```

---

## ARQUITECTURA DE RUTAS

```
app/
  (auth)/login/
  (dashboard)/
    page.tsx                   -- Dashboard
    bodegas/                   -- [NUEVA] reemplaza /productos
      page.tsx                 -- Selector de bodega
      [bodegaId]/page.tsx      -- Productos en esa bodega
    modulos/                   -- [NUEVA]
      page.tsx                 -- Selector de modulo
      [moduloId]/page.tsx      -- Mercaderia acumulada en ese modulo
    entradas/                  -- [REHECHO] flujo minimalista
      page.tsx
    salidas/                   -- [EXISTENTE, ajustes menores]
      page.tsx
    usuarios/
      page.tsx
  api/
    productos/buscar/          -- GET autocompletado desde arjun.inv_sdo
    productos/[id]/imagenes/   -- POST subir foto Cloudinary
    productos/[id]/historial/  -- GET historial movimientos paginado
    sync/winfac/               -- GET sync futuro (flag apagado)
```

---

## COMPONENTES CLAVE

```
components/
  layout/
    Sidebar.tsx                -- sidebar desktop colapsable
    DashboardShell.tsx         -- wrapper client responsive
    MobileNav.tsx              -- barra inferior movil
    Header.tsx
    SessionProvider.tsx
  shared/
    HistorialModal.tsx         -- [NUEVO] modal/drawer historial de movimientos
    NumericInput.tsx           -- [NUEVO] input numerico con UX: click borra 0
  mobile/
    BuscadorProducto.tsx       -- buscador con imagenes, filtro local
    BotonesModulo.tsx          -- 5 botones grandes modulos
    InputCantidad.tsx          -- input numerico cajas/unidades
    BotonFoto.tsx              -- captura foto con camara
  entradas/
    EntradasShell.tsx          -- [REHECHO] tabs Nuevo Ingreso / Historial
    BuscadorWinfac.tsx         -- [NUEVO] input con autocompletado arjun.inv_sdo
    EntradaForm.tsx            -- [NUEVO] form minimalista igual a SalidaForm
  salidas/
    SalidaForm.tsx             -- form movil + desktop
    SalidasShell.tsx           -- tabs Nuevo Despacho / Historial
  bodegas/
    BodegaSelector.tsx         -- [NUEVO] grid 3 bodegas
    BodegaProductos.tsx        -- [NUEVO] lista productos con lazy loader
  modulos/
    ModuloSelector.tsx         -- [NUEVO] grid 5 modulos
    ModuloProductos.tsx        -- [NUEVO] lista mercaderia acumulada
  productos/
    ProductoDetalle.tsx        -- tabs Resumen/Editar/Historial
    ProductoForm.tsx           -- form editar + opcion eliminar (admin)
    ImageUploader.tsx          -- subir imagen desktop
  usuarios/
    UsuarioModal.tsx           -- crear/editar usuario
```

---

## LOGICA DE NEGOCIO IMPORTANTE

**Autocompletado WinFac:**
- GET /api/productos/buscar?q=texto busca en arjun.inv_sdo
- Devuelve: { codigo, descripcion, packing, knumezet }
- Si el operario selecciona de la lista: crea producto con origenWinfac=true
- Si escribe libre y no selecciona: crea producto con origenWinfac=false

**Bodega persistente:**
- Al registrar entrada/salida: guardar bodegaId en productos.ubicacion
- Al recargar el producto: pre-seleccionar esa bodega

**Stock modulos:**
- cantidadAcumulada sube con cada salida hacia ese modulo
- Solo baja si feature_flag 'modulos_ventas' = true (actualmente false)

**Eliminar producto:**
- Solo admin. Verificar stock = 0 en todas las bodegas. Retornar error si no.

**Historial de producto:**
- Modal/drawer accesible al hacer click en imagen o detalles del producto
- En /salidas y en /entradas
- Une entradas + salidas ordenadas por fecha DESC, paginado 20 por pagina

**Activity log:**
- Toda accion que modifica datos escribe en activity_log
- Acciones: entrada.crear, salida.crear, producto.crear, producto.editar,
  producto.eliminar, usuario.crear, usuario.editar, conteo.fisico

**Inputs numericos:**
- onClick: seleccionar todo el contenido del input
- Previene digitos colgados a la izquierda
- Usar componente NumericInput en todo el proyecto

---

## FEATURE FLAGS

| Flag | Estado | Descripcion |
|---|---|---|
| `modulos_ventas` | false | Descontar ventas en modulos |
| `sync_winfac_automatico` | true | Sync automatico desde WinFac. Watermark: 26194159 |
| `kingnex_ocr` | false | OCR Kingnex para procesamiento de documentos |
| `image_sync_intranet` | false | Sincronizacion de imagenes con intranet |
| `mobile_pwa` | false | PWA instalable |
| `mobile_salidas` | false | Salidas desde movil |
| `mobile_stock` | false | Control de stock desde movil |
| `mobile_foto` | false | Captura de fotos desde movil |

---

## ESTADO ACTUAL

**Completado:**
- Login por username
- Inventario con imagenes Cloudinary
- Dashboard, /entradas, /salidas desktop + movil
- PWA instalable
- MobileNav, bodega persistente, conteo fisico, foto de producto
- Gestion de usuarios
- Seccion Bodegas (reemplaza /productos)
- Seccion Modulos (acumulado de salidas)
- Historial de producto (modal/drawer desde salidas y entradas)
- UX inputs numericos (NumericInput global)
- Auditoria completa (activity_log en toda accion)
- Editar/eliminar registros en /modulos con ajuste de stock en bodega origen ✅
- BotonFoto en /entradas movil ✅
- Fix scroll modal historial y modal edicion en movil ✅
- Fix NumericInput: borrar digitos en movil ✅
- Fix autocompletado movil: tap vs scroll ✅
- Buscador /entradas busca en public.productos + arjun.inv_sdo combinado ✅
- Sync WinFac activado con watermark de corte 26194159 (28 mayo 2026) ✅
- Reset de saldos a 0 ejecutado (fecha de corte) ✅
- Fix eliminarProducto: orden correcto de DELETE dependientes antes de borrar producto ✅

**Pendiente:**
- Modulo IA Kingnex (flag kingnex_ocr en false)
- Notificaciones stock bajo
- Exportar reportes CSV/Excel
- Encender modulos_ventas cuando el cliente lo pida

---

## USUARIOS EN PRODUCCION

| Username | Rol |
|---|---|
| admin | admin |
| anil | admin |
| test | operador |

---

## COMANDOS

```bash
# Desarrollo local
cd C:\Users\pablo\Documents\app-arjun
npm run dev                     # http://localhost:3000

# Deploy
git add -A
git commit -m "feat: descripcion"
git push origin main

# Tests
npx vitest run

# Sync manual (cuando se reactive)
Invoke-WebRequest -Uri "https://app-arjun.vercel.app/api/sync/winfac" -Headers @{"x-sync-key"="7EyhVZgiIL3D/XrZLCC4hNCz+YcAdv9CgJv2Uv9SBR8="} -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## REGLAS DE TRABAJO

1. Este chat (Director Tecnico) produce arquitectura y decisiones — NO codigo
2. Todo el codigo lo escribe Claude Code
3. Ciclos PBT-IA: A (contrato) → B (tests) → C (implementacion) → D (verificacion)
4. Maximo 200 lineas por slice
5. DIFFs unificados por archivo
6. NO commits sin aprobacion de Pablo
7. Trabajar directo en rama main
8. NUNCA asumir nada — solo informacion verificable
9. PROHIBIDO usar widget ask_user_input — preguntas directamente en texto
10. En PowerShell: no usar && — usar ; o bloques separados
