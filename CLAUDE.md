# CLAUDE.md — App Arjun v2.0

## Rol
Eres el programador del proyecto App Arjun.
Escribes TODO el codigo en ciclos PBT-IA segun las instrucciones del Director Tecnico (Claude chat).
No haces commits sin aprobacion de Pablo.

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **Runtime:** React 19
- **CSS:** Tailwind CSS v4 — USAR SOLO CLASES v4. No usar clases de v3.
- **TypeScript:** 5.9 — strict mode
- **ORM:** Drizzle ORM ^0.45
- **DB:** Neon PostgreSQL (serverless) — schema public (app) + schema arjun (WinFac, solo lectura)
- **Auth:** NextAuth v5 beta (Auth.js) — login username + password
- **Tests:** Vitest ^4.1
- **Deploy:** Vercel
- **Imagenes:** Cloudinary (cuenta Arjun: cloud dbl8yxnjy)

---

## Comandos

```bash
# Desarrollo
npm run dev                    # http://localhost:3000

# Tests
npx vitest run                 # todos los tests
npx vitest run --reporter=verbose

# Lint + typecheck
npm run lint
npx tsc --noEmit

# Build
npm run build

# Deploy
git add -A
git commit -m "feat: descripcion"
git push origin main           # Vercel deploya automaticamente
```

---

## Variables de Entorno

```
DATABASE_URL        postgresql://neondb_owner:...@ep-polished-sun-acqm10br-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
AUTH_SECRET         (en Vercel)
SYNC_KEY            7EyhVZgiIL3D/XrZLCC4hNCz+YcAdv9CgJv2Uv9SBR8=
CLOUDINARY_CLOUD_NAME   dbl8yxnjy
CLOUDINARY_API_KEY      (en Vercel)
CLOUDINARY_API_SECRET   (en Vercel)
```

---

## Estructura de Carpetas

```
app/
  (auth)/login/
  (dashboard)/
    page.tsx                   -- Dashboard
    bodegas/                   -- Sección bodegas (reemplaza /productos)
    modulos/                   -- Sección módulos
    entradas/                  -- Entradas rehecho (flujo minimalista)
    salidas/                   -- Salidas (ajustes menores)
    usuarios/
  api/
    productos/
      buscar/                  -- Autocompletado desde arjun.inv_sdo
      [id]/imagenes/
      [id]/historial/
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
    HistorialModal.tsx          -- Modal historial de movimientos por producto
    NumericInput.tsx            -- Input numerico con UX: click borra 0
lib/
  db/
    schema.ts                  -- Drizzle schema completo
    index.ts                   -- Cliente Neon
  utils/
  actions/                     -- Server actions
config/
  feature-flags.json
drizzle/
  migrations/
```

---

## Naming Conventions

- Archivos: kebab-case (`salida-form.tsx`, `numeric-input.tsx`)
- Componentes React: PascalCase (`SalidaForm`, `NumericInput`)
- Server actions: camelCase (`registrarEntrada`, `registrarSalida`)
- Variables DB: camelCase en Drizzle, snake_case en SQL
- Constantes: UPPER_SNAKE_CASE

---

## Reglas de Codigo

1. **Tailwind v4 unicamente.** Nunca usar clases de v3 que no existan en v4.
2. **Strict TypeScript.** Sin `any`. Sin `as unknown as X` salvo casos excepcionales documentados.
3. **Server actions** para mutaciones — no API routes para formularios.
4. **API routes** solo para: autocompletado (GET), webhooks, sync externo.
5. **Errores:** retornar `{ error: string }` — NO hacer throw en server actions (rompe la app).
6. **Activity log:** TODA accion que modifica datos escribe en activity_log.
7. **Feature flags:** leer desde config/feature-flags.json. Flag `modulos_ventas` en false.
8. **Inputs numericos:** usar componente `NumericInput` en todo el proyecto.
9. **Imagenes:** subir a Cloudinary cuenta Arjun (cloud: dbl8yxnjy).
10. **Max 200 lineas por slice.** Si se excede: proponer sub-slices a Pablo.

---

## Lógica de Negocio Clave

### Busqueda en WinFac (autocompletado)
- Endpoint: GET /api/productos/buscar?q=texto
- Fuente: arjun.inv_sdo (SOLO LECTURA — nunca escribir en schema arjun)
- Devuelve: codigo, descripcion, packing, knumezet (max 20 resultados)
- Se usa en /entradas para autocompletar al escribir nombre/codigo

### Crear producto desde entrada
- Si viene de WinFac: `origenWinfac = true`, guardar knumezet
- Si es manual libre: `origenWinfac = false`, knumezet = null
- Siempre crear registro en `stock` para la bodega seleccionada
- Siempre escribir en `activity_log`

### Bodega persistente
- Al registrar entrada o salida: guardar bodegaId en `productos.ubicacion`
- Al cargar el producto en el formulario: pre-seleccionar esa bodega

### Stock en modulos
- `stock_modulos.cantidadAcumulada` solo sube con cada salida
- Feature flag `modulos_ventas`: si false, no mostrar opcion de descontar ventas
- Si true: mostrar formulario de venta que resta de cantidadAcumulada

### Eliminar producto
- Solo rol admin
- Verificar que stock = 0 en todas las bodegas antes de eliminar
- Si stock > 0: retornar error con mensaje claro

### Historial de producto
- Endpoint: GET /api/productos/[id]/historial
- Une entradas + salidas ordenadas por fecha DESC
- Incluye: tipo (entrada/salida), fecha, cantidad, origen, destino, usuario
- Paginado: 20 por pagina con cursor

---

## Ciclo PBT-IA

Cuando Pablo diga "siguiente slice" o "ciclo":

**Fase A — Contrato (BLOQUEANTE)**
Proponer contrato. Esperar aprobacion de Pablo. No avanzar sin ella.

**Fase B — Tests Rojos**
Generar 1-2 tests de integracion + 1 smoke E2E en DIFF.
Dar comandos exactos para ejecutarlos.

**Fase C — Implementacion**
Confirmar files-to-touch. Estimar lineas.
Si excede 200: proponer sub-slices.
Implementar en DIFF unificado por archivo.

**Fase D — Verificacion**
Dar comandos de lint/typecheck/tests.
Confirmar verde con evidencia.
Agregar entry en config/feature-flags.json si aplica.

**Cierre**
Resumen: que se agrego, contrato, tests, flag.
Preguntar: "Hacemos commit o ajustamos algo?"

---

## Referencia

Ver PRD.md para backlog completo, schema DB y reglas de negocio.
