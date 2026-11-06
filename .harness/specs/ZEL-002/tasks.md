# Tareas: ZEL-002 Mapas del cielo y de las profundidades con navegación entre capas

**Entradas:** `spec.md`, `constitution.md` v1.0.0, `plan.md`, `research.md`, `data-model.md`, `quickstart.md` (no hay contratos OpenAPI)
**Creado:** 2026-11-06

## Blast Radius

| # | Archivo | Tipo | Tareas |
| :-: | :--- | :--- | :--- |
| 1 | `proyecto/assets/img/sky.jpg` | Creación | T003 |
| 2 | `proyecto/assets/img/depths.jpg` | Creación | T003 |
| 3 | `proyecto/js/app.js` | Modificación | T004, T005, T006, T007, T008, T009, T010, T013, T015 |
| 4 | `proyecto/index.html` | Modificación | T011 |
| 5 | `proyecto/css/styles.css` | Modificación | T012, T014 |

**Total:** 5 de 5 permitidos. Ningún archivo fuera de esta tabla puede modificarse sin aprobación del desarrollador.

No cuentan (ignorados por git): `.harness/runs/ZEL-002/tools/stitch_tiles.py`, `.harness/runs/ZEL-002/tiles/` y `.harness/runs/ZEL-002/ground-check.jpg`.

## Leyenda

- `[P]`: paralelizable (archivos distintos, sin dependencias).
- `[USn]`: historia que atiende.
- `[W:<capa>]`: worker sugerido para el orquestador.
- Una tarea se marca cambiando `[ ]` por `[x]` solo cuando sus gates pasan.

Historias:

- **US1 (P1):** navegar entre Cielo, Superficie y Profundidades con ↑/↓ y con botones; ver por capa sus marcadores, lista y contadores; recordar la capa.
- **US2 (P2):** transición animada de ascenso y descenso, con la variante de movimiento reducido.

## Etapa 1 — Preparación

> **Requiere consentimiento explícito del desarrollador antes de ejecutarse** (`security.md` §3, constitución V): descarga unas 1440 teselas de `objmap-totk.zeldamods.org`.

- [ ] T001 [W:cliente] Crear el script de descarga, unión y recorte de teselas del zoom 5 (24 × 20, 256 px → 6000 × 5000, JPEG calidad 85→75, retardo de 100 ms, caché y modo `--compare`) en `.harness/runs/ZEL-002/tools/stitch_tiles.py` (R2, R3)
- [ ] T002 [W:test] Reconstruir la capa `Ground` en `.harness/runs/ZEL-002/ground-check.jpg` y compararla con `proyecto/assets/img/surface.jpg` (error medio < 12/255). Si falla, detener y sugerir `BLOCKED`. Registrar en la bitácora el resultado, la fuente, la URL y la licencia (R2, R4)
- [ ] T003 [W:cliente] Generar `proyecto/assets/img/sky.jpg` y `proyecto/assets/img/depths.jpg` (6000 × 5000, ≤ 7 905 335 bytes) y revisar los recortes de los atuendos `0051` y `0057`; registrar pesos y verificación en la bitácora (RF-002, RF-018, RNF-003, CE-003)

## Etapa 2 — Fundacional

- [ ] T004 [W:modelo] Declarar `LAYERS` (`sky`, `surface`, `depths` con etiqueta e imagen), `layerIndex`, `STORAGE_LAYER = "totk.map.layer.v1"` y `layerOf(item)`; quitar el filtro fijo `layer === "surface"` de `CATEGORIES.outfits` en `proyecto/js/app.js` (RF-001, RF-013, constitución I)
- [ ] T005 [W:estado] Agregar `loadLayer()` y `saveLayer()` con `try/catch` y `surface` por defecto ante valores inválidos en `proyecto/js/app.js` (RF-015, constitución IV)
- [ ] T006 [W:componente] Agregar `ensureOverlay(layer)` con overlay perezoso y reutilizable, eventos `load`/`error`, clase `map--no-image`, toast de error y atribución "Mapas: ZeldaMods TotK Object Map"; usarlo en `initMap()` en lugar del overlay fijo de superficie, en `proyecto/js/app.js` (RF-002, RNF-002, R4, R8)

## Etapa 3 — Historia 1 (P1): navegar entre capas

**Objetivo:** cambiar de capa con ↑/↓ y botones, con contenido filtrado por capa y capa recordada (cambio instantáneo, todavía sin animación).
**Prueba independiente:** escenarios 1–11 y 13–17 de `quickstart.md` §3 (sin evaluar la animación) y gates 5.1–5.3 + `CAPAS_OK`.

- [ ] T007 [US1] [W:estado] Hacer que `renderList()`, `appliedFilters()` y `updateStats()` consideren solo los elementos de la capa visible, con el estado vacío "No hay <plural> en <capa>" y texto escapado, en `proyecto/js/app.js` (RF-011, RF-012)
- [ ] T008 [US1] [W:estado] Agregar `applyLayer(index)` (cerrar popup y selección, cambiar overlay, rellenar el cluster activo con los marcadores de la capa, refrescar lista, textos, contadores y filtros, `updateLayerControl()`, `announceLayer()` y `saveLayer()`), y hacer que `setCategory()` rellene el cluster con la capa visible, en `proyecto/js/app.js` (RF-007, RF-011, RF-016, constitución II)
- [ ] T009 [US1] [W:estado] Agregar `setLayer(dir)` como operación única (límites con señal `is-bump`, indicador `layerBusy`) y aplicar la capa guardada en `start()`, en `proyecto/js/app.js` (RF-003, RF-005, RF-010, RF-015, constitución II)
- [ ] T010 [US1] [W:controlador] Registrar `keydown` en fase de captura para ↑/↓ (ignorar `event.repeat`, campos de texto, modal de reinicio abierto y panel lateral móvil abierto; `preventDefault` + `stopPropagation`), los clics en `#layerUp`/`#layerDown` y el texto del modal de reinicio "en las tres capas", en `proyecto/js/app.js` (RF-003, RF-004, RF-006, RF-017, R5, R7)
- [ ] T011 [P] [US1] [W:componente] Agregar `nav.layer-switch` (`#layerUp`, `#layerName`, `#layerPos`, `#layerDown` con `aria-label`), `#layerTransition` (`aria-hidden`) y `#layerStatus` (`sr-only`, `aria-live="polite"`) sin renombrar IDs existentes, en `proyecto/index.html` (RF-006, RF-007, RNF-004)
- [ ] T012 [P] [US1] [W:componente] Agregar estilos del control de capas (estado deshabilitado, foco visible y `is-bump`), `.map--no-image` y `.sr-only` si no existe, en `proyecto/css/styles.css` (RF-005, RF-006, RNF-004)

## Etapa 4 — Historia 2 (P2): transición animada

**Objetivo:** animación original de ascenso y descenso de unos 1 s y fundido con movimiento reducido.
**Prueba independiente:** escenarios 1, 2, 5, 12 y 18 de `quickstart.md` §3.

- [ ] T013 [P] [US2] [W:estado] Integrar en `setLayer(dir)` las clases `is-ascending`, `is-descending` e `is-fading` de `#layerTransition`, llamar a `applyLayer` en el punto medio y liberar `layerBusy` en `animationend` o a los 1200 ms; detectar `prefers-reduced-motion`, en `proyecto/js/app.js` (RF-008, RF-009, RF-010, CE-001, constitución III)
- [ ] T014 [P] [US2] [W:componente] Agregar `.layer-transition` con `@keyframes` de salida y entrada por sentido (luz y nubes con `radial-gradient` al subir; oscurecimiento y brillo tenue al bajar), sin imágenes externas, y `@media (prefers-reduced-motion: reduce)` con fundido de 300 ms, en `proyecto/css/styles.css` (RF-008, RF-009, CE-006, constitución III)

## Etapa final — Pulido

- [ ] T015 [W:test] Ejecutar los gates 5.1, 5.2 y 5.3 de `AGENTS.md`, la comprobación `CAPAS_OK` y los 18 escenarios manuales de `quickstart.md` (`http://127.0.0.1` y `file://`); medir el diff (≤ 300 líneas); registrar resultados en la bitácora. Si un gate falla, corregir solo en `proyecto/js/app.js` u otro archivo del Blast Radius (constitución VI, CE-001 a CE-006)
- [ ] T016 [W:test] Redactar en la entrada `CIERRE` de `.harness/memory/logs/ZEL-002.md` la actualización propuesta para `.harness/context/data-contracts.md` §3 (`totk.map.layer.v1`) y `system-overview.md` §0, §1 y §5 (capas e IDs nuevos), y proponer lecciones en `.harness/memory/lessons-learned.md`

## Dependencias

- T001 → T002 → T003. T003 bloquea toda la Etapa 2 en adelante (constitución V: imágenes verificadas antes del código).
- T004 → T005 → T006 (mismo archivo, en secuencia).
- T006 bloquea T007 → T008 → T009 → T010 (mismo archivo).
- T011 y T012 son `[P]` entre sí y con T007–T010 (archivos distintos). Deben estar hechas antes de verificar US1.
- US1 completa (T007–T012) bloquea T013 y T014. Ambas son `[P]`: tocan archivos distintos y comparten solo los nombres de clase fijados en `plan.md`.
- T015 depende de todas las anteriores; T016 depende de T015.

## Cobertura de requisitos

| Requisito | Tareas |
| :--- | :--- |
| RF-001 | T004 |
| RF-002 | T003, T006 |
| RF-003 | T009, T010 |
| RF-004 | T010 |
| RF-005 | T009, T012 |
| RF-006 | T010, T011, T012 |
| RF-007 | T008, T011 |
| RF-008 | T013, T014 |
| RF-009 | T013, T014 |
| RF-010 | T009, T013 |
| RF-011 | T007, T008 |
| RF-012 | T007 |
| RF-013 | T004 |
| RF-014 | Sin cambio en `toggleWell`; verificado en T015 (escenario 10) |
| RF-015 | T005, T009 |
| RF-016 | T008 |
| RF-017 | T010 |
| RF-018 | T003 |
| RNF-001 a RNF-005 | T003, T006, T011, T012, T015, T002 (licencia) |
