● He completado un barrido exhaustivo de toda la superficie crítica (server actions, API routes, auth/middleware, schema, forms y páginas), más tsc --noEmit (limpio) y la suite de tests (20 fallan / 11
  archivos, en su mayoría obsoletos). Acá está el informe completo.

  ---
  Informe de bugs — App Arjun

  Severidad: 🔴 crítico · 🟠 alto · 🟡 medio · ⚪ bajo. Las referencias son archivo:línea.

  🔴 Críticos (corrupción de datos / pérdida silenciosa / seguridad)

  1. El "Actualizar Stock" móvil pre-carga y puede sobrescribir con la cantidad de OTRO producto
  app/(dashboard)/mobile/stock/page.tsx:13-19 arma stocksPlanos desde todos los stocks pero descarta productoId. En components/mobile/StockForm.tsx:30-33, stockProducto filtra solo por s.bodegaId !== "" —
  nunca por el producto seleccionado. Entonces bodegaActual (:35-39) encuentra el stock de un producto cualquiera para esa bodega, y :119 pre-llena "cantidad contada" con ese valor erróneo. Como
  actualizarStock reemplaza (no suma) el stock, el operador puede confirmar y corromper el stock del producto correcto con el número de otro. También provoca keys de React duplicados (key={s.bodegaId} en :98).
  Fix: incluir productoId en StockInfo y filtrar stocks.filter(s => s.productoId === producto.id).

  2. El sync usa el NOMBRE de bodega como UUID → productos con ubicación dejan de sincronizarse
  app/api/sync/winfac/route.ts:139 y app/api/admin/reprocesar-sync/route.ts:137: const bodegaId = ubicacion || bodegaArjunId. Pero productos.ubicacion guarda el nombre de la bodega (ej. "Bodega Arjun"), no el
  UUID — confirmado en lib/actions.ts:167,279,376. Luego se usa en WHERE bodega_id = '${bodegaId}' contra una columna UUID → invalid input syntax for type uuid → el catch ignora la fila → el watermark igual
  avanza → ese producto nunca más recibe stock de WinFac. Afecta a todo producto existente con ubicación asignada.
  Fix: resolver el UUID por nombre (SELECT id FROM bodegas WHERE nombre = ubicacion) o usar siempre bodegaArjunId.

  3. El watermark del sync avanza por encima de filas con error → salto permanente
  app/api/sync/winfac/route.ts:205: nuevoVisa = rows[rows.length-1].visa_key se fija al último de la tanda sin importar si filas intermedias fallaron o se ignoraron por causa transitoria (falta admin/bodega,
  error de cast, decimal en stocdisp). Como las filas se ordenan ASC y el watermark salta al máximo, cualquier fila fallida queda por debajo del corte y no se reintenta jamás.
  Fix: avanzar el watermark solo hasta el último visa_key procesado con éxito.

  4. Bypass de autenticación en rutas y APIs
  - middleware.ts:5 — protectedRoutes omite /bodegas, /modulos y /mobile/stock. Para una ruta no listada, el middleware cae en NextResponse.next() (:29).
  - app/(dashboard)/layout.tsx:18 llama auth() pero nunca verifica null ni redirige (session?.user?.role || "operador").
  - Resultado: esas páginas consultan la DB directamente sin sesión (confirmado en app/(dashboard)/bodegas/page.tsx:7) → stock y datos visibles sin login.
  - middleware.ts:33 — el matcher excluye todo /api, y ni app/api/productos/buscar/route.ts ni app/api/productos/[id]/historial/route.ts llaman auth() → catálogo, datos de WinFac e historial públicos.
  Fix: agregar las rutas faltantes a protectedRoutes (o redirigir en el layout) y añadir auth() a esos GET.

  🟠 Altos (crashes / concurrencia)

  5. eliminarProducto revienta por FK y no es transaccional
  lib/actions.ts:455-492 borra activityLog, productoImagenes, stockModulos, stock, entradas, salidas — pero no traslados. traslados.productoId referencia productos.id sin onDelete (db/schema.ts:152-153) → el
  DELETE productos final lanza violación de FK para cualquier producto con historial de traslado. Además los deletes son await secuenciales sin transacción: si falla a mitad, deja el producto pero ya borró su
  historial → corrupción.
  Fix: borrar traslados también y envolver todo en una transacción.

  6. eliminarUsuario revienta por FK
  lib/user-actions.ts:59 hace DELETE usuarios directo, pero entradas/salidas/traslados/activityLog/codigoPersonalAuditoria referencian usuarios.id sin onDelete → borrar cualquier usuario que haya registrado un
  movimiento lanza FK violation (que se propaga como throw). En la práctica, ningún usuario activo se puede eliminar. Tampoco impide borrar al último admin / a uno mismo (lockout).
  Fix: bloquear si tiene movimientos (o soft-delete), validar que no sea el último admin, y devolver {error} en vez de throw.

  7. registrarEntrada: race de "lost update" en stock
  lib/actions.ts:139-154 lee existingStock y luego escribe cantidadActual + cantidad en pasos separados (no atómico). Dos entradas concurrentes al mismo producto+bodega se pisan y se pierde una. La salida ya
  se arregló con CTE atómico (:212-235), pero la entrada quedó con el patrón viejo.
  Fix: UPDATE ... SET cantidad_actual = cantidad_actual + ${cantidad} atómico, o INSERT ... ON CONFLICT DO UPDATE.

  8. /api/traslados: TOCTOU → stock negativo
  app/api/traslados/route.ts:38-51 chequea el stock fuera de la transacción y el UPDATE de :55-59 no re-valida cantidad_actual >= cant. Bajo concurrencia (otro traslado/salida en medio), el origen puede quedar
  negativo. Mismo patrón que se arregló en salidas.
  Fix: mover la guarda dentro del UPDATE (WHERE ... AND cantidad_actual >= ${cant}) y verificar filas afectadas.

  🟡 Medios (lógica / auditoría)

  9. getVisaCorte usa el watermark móvil del sync como piso de visibilidad
  lib/utils/get-visa-corte.ts lee sync_winfac_log.ultimo_numero_visa — el mismo valor que el sync incrementa en cada corrida (sync/winfac/route.ts:210). Ese número se usa como filtro visa_key >= corte en
  buscarProductos (lib/actions.ts:408), dashboard (page.tsx:35,51) y buscar. Consecuencia: cada sync sube el corte y oculta los productos WinFac de visaciones anteriores de la búsqueda y el dashboard. Es un
  uso conflictivo de un único valor (progreso de ingesta vs. filtro de display). Conviene confirmar si es intencional.

  10. El conteo físico se registra como entrada → historial inflado
  lib/actions.ts:336-342: registrarConteoFisico inserta una fila en entradas con la cantidad absoluta contada (origen conteo_fisico) y luego reemplaza el stock. El stock queda bien (se setea, no se suma), pero
  el historial del producto muestra cada recuento como una "entrada" engañosa (recontar a 3 aparece como "+3").
  Fix: registrar el conteo como ajuste/auditoría, no como entrada, o marcarlo aparte en el historial.

  11. El badge "productos sin bodega" siempre es 0 (función muerta)
  app/(dashboard)/layout.tsx:19-23 consulta isNull(entradas.bodegaId), pero entradas.bodegaId es .notNull() (db/schema.ts:93-95) → siempre 0 filas; el badge nunca aparece. Corroborado por los tests fallidos
  badges-bodega.test.ts y productos-cards.test.ts (esperan ese badge).

  12. Server actions hacen throw en vez de {error} (viola regla 5 del CLAUDE.md)
  registrarEntrada/registrarSalida/createOrUpdateProducto (lib/actions.ts:13,113,16,115,190) lanzan en auth() y en Schema.parse(); user-actions.ts también. La regla dice explícitamente "NO hacer throw — rompe
  la app". Inputs inválidos (ZodError) burbujean al cliente.

  ⚪ Bajos (robustez / código muerto / a11y)

  - 13. split_part(knumezet,'-',2)::bigint crashea si algún producto tiene knumezet no-nulo y mal formado (sin guiones) → ''::bigint falla; el catch del dashboard (page.tsx:62) mostraría falsamente "Base de
  datos no inicializada". Afecta dashboard, buscarProductos y buscar. Solo protegido por IS NULL.
  - 14. EntradaForm crea el producto WinFac dos veces: pre-creación en :66 + de nuevo en handleConfirmar:140 (porque selectedProducto.id sigue indefinido). Se deduplica por código (no crea fila duplicada) pero
  genera trabajo y activity_log redundantes.
  - 15. app/api/productos/[id]/historial/route.ts:15-17: cursorClause con interpolación cruda ('${cursor}') es código muerto (las queries reales sí parametrizan). Riesgo latente de inyección si alguien lo
  reusa.
  - 16. Paginación por cursor con < timestamp (historial :33,50 y modulos/[moduloId]/page.tsx:50,74): puede saltarse filas que compartan exactamente el timestamp del borde (posible en inserts masivos del sync
  con now()).
  - 17. app/(dashboard)/modulos/[moduloId]/page.tsx:34: notFound() está dentro del try y lo atrapa el catch de :119 → en vez de un 404 muestra "Tabla stock_modulos no encontrada".
  - 18. createOrUpdateProducto retorna existingSameCode (objeto pre-update, lib/actions.ts:84) cuando el código ya existe → si la ubicación cambió, el caller recibe el valor viejo.
  - 19. SalidaForm.tsx:314,476: actualizarUbicacionProducto(...) se llama sin await y puede ir con productoId vacío → promesa rechazada sin manejar.
  - 20. BuscadorProducto selecciona solo con onPointerDown/Up (:80-87), no onClick → no es seleccionable por teclado (Enter no dispara). (Es la causa del fallo de mobile-salidas.test.tsx.)
  - 21. LoginSchema.password es min(1) (lib/validations.ts:5); el test auth.test.ts espera ≥6 → política de contraseña relajada.
  - 22. eliminarProducto:470 borra activity_log por registroId = id del producto: destruye auditoría innecesariamente (no hay FK que lo exija) y de paso no cubre los logs de entradas/salidas.

  Salud de la suite de tests

  tsc --noEmit pasa limpio. Pero 20 tests fallan en 11 archivos, en su mayoría obsoletos: los de winfac/sync-winfac/winfac-nv describen una arquitectura que ya no existe (vida.movidcto, sanjh.movidcto,
  vida.itemdcto, filtros kcodclie), cuando la implementación actual lee arjun.inv_sdo. tests/productos.test.ts y tests/salidas.test.ts tienen mocks desactualizados (mockean db.update/db.transaction que el
  código ya no usa — ahora usa neon() y retorna {error} en vez de lanzar). Esto significa que las rutas más críticas (validación de stock en salidas y el sync) quedaron sin cobertura real, y dos tests
  (badges-bodega, productos-cards) confirman el bug #11.

  ---
  Los más urgentes por impacto: #1 (corrupción de stock desde el móvil), #2 y #3 (productos que dejan de sincronizar en silencio), #4 (datos sin auth), #5 y #6 (no se pueden borrar productos/usuarios sin
  crash).

  Ninguno de los de concurrencia (#7, #8) los reproduje contra una DB real — están razonados desde el código; el resto es verificable por lectura directa. No toqué nada (según el ciclo PBT-IA y "no commits sin
  aprobación").

  Sugiero empezar por #1 y #4, o por el grupo de sync (#2+#3). Decime cuál y armo el contrato.
