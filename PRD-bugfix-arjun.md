# PRD — Corrección de Bugs · App Arjun

## Principio rector

**No cambiar comportamiento visible para el usuario.** Cada fix corrige un error interno sin alterar flujos existentes. Si un fix requiere cambiar una pantalla, debe mantener exactamente la misma interacción que hoy existe.

El desarrollo sigue ciclos PBT-IA. Cada slice tiene un contrato claro. No se toca nada fuera del alcance declarado.

---

## Stack (existente — no cambiar)

- Next.js (App Router)
- Neon PostgreSQL + Drizzle ORM
- NextAuth
- Vitest
- TypeScript + ESLint

---

## Backlog priorizado

### SLICE 1 — Bug #1: Stock móvil pre-carga valor de otro producto

**Archivos a tocar:**
- `app/(dashboard)/mobile/stock/page.tsx` (líneas 13–19)
- `components/mobile/StockForm.tsx` (líneas 30–39, 98, 119)

**Contrato:**
- `StockInfo` debe incluir el campo `productoId`
- En `StockForm.tsx`, `stockProducto` debe filtrar por `s.productoId === producto.id` además de `s.bodegaId !== ""`
- `bodegaActual` usa solo el stock del producto correcto
- El campo "cantidad contada" se pre-llena con el stock del producto seleccionado, no de otro
- La key de React en el map de stocks pasa a `key={s.productoId + s.bodegaId}` para eliminar duplicados

**NO tocar:** lógica de `actualizarStock`, pantallas de entrada/salida, cualquier otro componente mobile.

---

### SLICE 2 — Bugs #2 y #3: Sync usa nombre de bodega como UUID y watermark avanza sobre errores

**Archivos a tocar:**
- `app/api/sync/winfac/route.ts` (líneas 139, 205)
- `app/api/admin/reprocesar-sync/route.ts` (línea 137)

**Contrato:**

Bug #2 — Resolver UUID de bodega:
- Antes de usar `ubicacion` como `bodegaId`, ejecutar `SELECT id FROM bodegas WHERE nombre = $1`
- Si la query retorna un resultado, usar ese UUID
- Si no retorna resultado (nombre no existe), usar `bodegaArjunId` como fallback
- Aplicar el mismo fix en `reprocesar-sync/route.ts`

Bug #3 — Watermark solo avanza en éxito:
- Mantener una variable `lastSuccessfulVisaKey` que se actualiza solo cuando una fila se procesa sin error
- Al final del lote, usar `lastSuccessfulVisaKey` en lugar de `rows[rows.length-1].visa_key`
- Si ninguna fila tuvo éxito, no actualizar el watermark

**NO tocar:** lógica de asignación de bodega por vendedor RUT, script Python `sync_arjun_neon.py`, tabla `sync_winfac_log` más allá del campo `ultimo_numero_visa`.

---

### SLICE 3 — Bug #4: Bypass de autenticación en rutas y APIs

**Archivos a tocar:**
- `middleware.ts` (líneas 5, 29, 33)
- `app/(dashboard)/layout.tsx` (línea 18)
- `app/api/productos/buscar/route.ts`
- `app/api/productos/[id]/historial/route.ts`

**Contrato:**
- Agregar `/bodegas`, `/modulos` y `/mobile/stock` al array `protectedRoutes` en `middleware.ts`
- En `app/(dashboard)/layout.tsx`: si `auth()` retorna `null`, redirigir a `/login`
- En `app/api/productos/buscar/route.ts`: agregar `const session = await auth(); if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401})`
- En `app/api/productos/[id]/historial/route.ts`: mismo patrón de auth check

**NO tocar:** lógica de roles, flujo de login, cualquier otra ruta de API.

---

### SLICE 4 — Bug #5: eliminarProducto revienta por FK y no es transaccional

**Archivos a tocar:**
- `lib/actions.ts` (líneas 455–492)
- `db/schema.ts` (líneas 152–153) — solo para confirmar FK de traslados

**Contrato:**
- Envolver todos los deletes de `eliminarProducto` en una única transacción db
- Agregar `DELETE FROM traslados WHERE producto_id = $id` antes del DELETE final de productos
- Orden de borrado dentro de la transacción: activityLog → productoImagenes → stockModulos → stock → entradas → salidas → traslados → producto
- Si cualquier delete falla, la transacción hace rollback completo

**NO tocar:** ningún otro server action, schema de otras tablas.

---

### SLICE 5 — Bug #6: eliminarUsuario revienta por FK

**Archivos a tocar:**
- `lib/user-actions.ts` (línea 59 y alrededores)

**Contrato:**
- Antes de borrar, verificar si el usuario tiene registros en entradas, salidas, traslados, activityLog o codigoPersonalAuditoria
- Si tiene cualquier movimiento: retornar `{error: "No se puede eliminar un usuario con movimientos registrados"}` — NO hacer throw
- Verificar que no sea el último usuario con rol admin: retornar `{error: "No se puede eliminar al último administrador"}` — NO hacer throw
- Verificar que el usuario no se esté borrando a sí mismo: retornar `{error: "No puedes eliminar tu propio usuario"}` — NO hacer throw
- Solo si pasa todas las validaciones: ejecutar el DELETE

**NO tocar:** lógica de creación o edición de usuarios, auth.

---

### SLICE 6 — Bug #7: registrarEntrada tiene race condition de lost update

**Archivos a tocar:**
- `lib/actions.ts` (líneas 139–154)

**Contrato:**
- Reemplazar el patrón leer-luego-escribir por un UPDATE atómico:
  - Si existe registro en stock: `UPDATE stock SET cantidad_actual = cantidad_actual + $cantidad WHERE producto_id = $id AND bodega_id = $bodegaId`
  - Si no existe: `INSERT INTO stock (producto_id, bodega_id, cantidad_actual) VALUES (...) ON CONFLICT (producto_id, bodega_id) DO UPDATE SET cantidad_actual = stock.cantidad_actual + EXCLUDED.cantidad_actual`
- El resto del flujo de registrarEntrada (activity log, respuesta) no cambia

**NO tocar:** registrarSalida (ya tiene CTE atómico), ningún otro server action.

---

### SLICE 7 — Bug #8: /api/traslados tiene TOCTOU → stock negativo

**Archivos a tocar:**
- `app/api/traslados/route.ts` (líneas 38–59)

**Contrato:**
- Eliminar la verificación de stock previa a la transacción (líneas 38–51)
- El UPDATE del stock origen debe incluir la guarda en el WHERE: `UPDATE stock SET cantidad_actual = cantidad_actual - $cant WHERE producto_id = $id AND bodega_id = $origen AND cantidad_actual >= $cant`
- Verificar `rowsAffected === 1` después del UPDATE; si es 0, hacer rollback y retornar `{error: "Stock insuficiente"}`
- El mensaje de error al cliente es el mismo que hoy

**NO tocar:** lógica del stock destino, tabla traslados, ninguna otra ruta.

---

### SLICE 8 — Bugs medios y bajos (#10–22, excepto #9)

Este slice se divide en sub-tareas. Claude Code puede agruparlas o ejecutarlas una por una según conveniencia.

**Bug #10 — Conteo físico aparece como entrada en historial**
- Archivo: `lib/actions.ts` (línea 336–342)
- Fix: cambiar el `origen` del insert en entradas de `"conteo_fisico"` a `"ajuste"` o agregar un campo `tipo` que permita distinguirlo en el historial
- El stock sigue reemplazándose (no sumando) — eso no cambia

**Bug #11 — Badge "productos sin bodega" siempre es 0**
- Archivo: `app/(dashboard)/layout.tsx` (líneas 19–23)
- Fix: la query debe buscar productos que no tienen ningún registro en stock (o cuyo stock está vacío), no `isNull(entradas.bodegaId)` que es notNull por schema
- Consulta sugerida: `SELECT COUNT(*) FROM productos WHERE id NOT IN (SELECT producto_id FROM stock)`

**Bug #12 — Server actions hacen throw en vez de retornar {error}**
- Archivos: `lib/actions.ts` (líneas 13, 113, 16, 115, 190), `lib/user-actions.ts`
- Fix: envolver los `throw` en auth() y Schema.parse() con try/catch que retornen `{error: mensaje}`
- Ningún server action debe propagar excepciones al cliente

**Bug #13 — split_part crashea con knumezet mal formado**
- Archivos: dashboard `page.tsx` (línea 62), `lib/actions.ts` (buscarProductos), `app/api/productos/buscar/route.ts`
- Fix: agregar guarda `knumezet LIKE '%-%-%%'` o `LENGTH(knumezet) - LENGTH(REPLACE(knumezet, '-', '')) >= 2` antes del cast a bigint

**Bug #14 — EntradaForm crea producto WinFac dos veces**
- Archivo: `components/EntradaForm.tsx` (líneas 66, 140)
- Fix: guardar el `id` retornado por la pre-creación en `:66` en `selectedProducto.id` para que `handleConfirmar` no vuelva a crear

**Bug #15 — Interpolación cruda de cursor en historial (código muerto)**
- Archivo: `app/api/productos/[id]/historial/route.ts` (líneas 15–17)
- Fix: eliminar o parametrizar correctamente el `cursorClause` con interpolación cruda

**Bug #16 — Paginación por cursor puede saltarse filas con mismo timestamp**
- Archivos: `app/api/productos/[id]/historial/route.ts` (líneas 33, 50), `app/(dashboard)/modulos/[moduloId]/page.tsx` (líneas 50, 74)
- Fix: usar cursor compuesto `(timestamp, id)` para el paginado: `WHERE (created_at, id) < ($ts, $id)`

**Bug #17 — notFound() dentro de try queda atrapado por catch**
- Archivo: `app/(dashboard)/modulos/[moduloId]/page.tsx` (línea 34)
- Fix: mover la llamada `notFound()` fuera del bloque try/catch, o re-lanzarla en el catch si es una instancia de `NotFoundError`

**Bug #18 — createOrUpdateProducto retorna objeto pre-update**
- Archivo: `lib/actions.ts` (línea 84)
- Fix: después del update, hacer SELECT del producto actualizado y retornarlo, no `existingSameCode`

**Bug #19 — actualizarUbicacionProducto llamado sin await en SalidaForm**
- Archivo: `components/SalidaForm.tsx` (líneas 314, 476)
- Fix: agregar `await` a ambas llamadas; manejar el posible error con try/catch

**Bug #20 — BuscadorProducto no seleccionable por teclado**
- Archivo: componente `BuscadorProducto`
- Fix: agregar handler `onKeyDown` que dispare la selección al presionar Enter, además del handler de pointer existente

**Bug #21 — LoginSchema.password acepta min 1 carácter**
- Archivo: `lib/validations.ts` (línea 5)
- Fix: cambiar `min(1)` a `min(6)` para alinear con el test y política real
- Verificar que ningún usuario existente tenga contraseña de menos de 6 caracteres antes de aplicar (solo validación de schema, no migración)

**Bug #22 — eliminarProducto borra activity_log del producto por registroId**
- Archivo: `lib/actions.ts` (línea 470)
- Fix: cambiar el criterio de borrado de `registroId = productoId` a `WHERE entidad_id = productoId AND entidad_tipo = 'producto'` (o el esquema equivalente que use la tabla activityLog)

---

### SLICE 9 — Limpieza de suite de tests

**Objetivo:** dejar `vitest` en verde. No agregar tests nuevos de features; solo corregir los obsoletos y los que confirman bugs ya arreglados en slices anteriores.

**Archivos a tocar:**
- `tests/winfac/*.test.ts` y `tests/sync-winfac/*.test.ts` y `tests/winfac-nv/*.test.ts` — actualizar o eliminar los tests que describen la arquitectura antigua (vida.movidcto, sanjh.movidcto, vida.itemdcto, kcodclie)
- `tests/productos.test.ts` — actualizar mocks de `db.update`/`db.transaction` para reflejar que ahora se usa `neon()` y se retorna `{error}`
- `tests/salidas.test.ts` — mismo patrón
- `tests/badges-bodega.test.ts` y `tests/productos-cards.test.ts` — actualizar para reflejar el fix del bug #11

**Contrato:**
- `vitest run` debe terminar en 0 fallos
- `tsc --noEmit` debe seguir limpio
- No eliminar tests válidos que cubran comportamiento real

---

## Orden de ejecución recomendado

```
Slice 1 → Slice 2 → Slice 3 → Slice 4 → Slice 5 → Slice 6 → Slice 7 → Slice 8 → Slice 9
```

Cada slice termina con `tsc --noEmit` + `vitest run` en verde antes de hacer commit.

---

## Restricciones globales

- No cambiar comportamiento visible para el usuario en ningún slice
- No modificar el schema de la DB (no hay migraciones en este PRD)
- No tocar `sync_arjun_neon.py`
- No hacer commits sin aprobación de Pablo
- Cada server action debe retornar `{error: string}` ante fallo — nunca hacer throw
- El watermark `ultimo_numero_visa` en `sync_winfac_log` es de solo-lectura para display; el sync lo actualiza únicamente al procesar filas con éxito
