# Plan de implementación: ZEL-002 Mapas del cielo y de las profundidades con navegación entre capas

**Spec:** `spec.md` | **Constitución:** `constitution.md` v1.0.0
**Creado:** 2026-11-06

## Resumen

Se generan `sky.jpg` y `depths.jpg` (6000 × 5000 px) uniendo las teselas del zoom 5 del TotK Object Map de ZeldaMods. Antes, el encuadre se valida reconstruyendo la superficie y comparándola con `surface.jpg`. En `app.js` se declara una lista única de capas (`LAYERS`) con un `L.imageOverlay` perezoso por capa y una sola operación `setLayer(dir)`. Esa operación bloquea entradas, reproduce una transición CSS propia de ascenso o descenso, cambia la imagen en el punto medio, rellena el cluster de la categoría activa con los marcadores de esa capa y refresca la lista, los filtros y los contadores. Las flechas ↑/↓ se capturan antes que Leaflet. En `index.html` se añaden un control de capas visible, la superposición de transición y una región `aria-live`. El progreso y sus claves no cambian; la última capa se guarda en `totk.map.layer.v1`.

## Contexto técnico

**Lenguaje / versión:** JavaScript ES5 (IIFE con `"use strict"`), HTML5 y CSS3.
**Dependencias principales:** jQuery, Leaflet (`L.CRS.Simple`, `L.imageOverlay`) y Leaflet.markercluster, vendorizados. Ninguna nueva.
**Almacenamiento:** `localStorage`. La nueva clave `totk.map.layer.v1` se suma a las existentes, que no cambian.
**Pruebas:** gates de Node de `AGENTS.md` §5, la comprobación `CAPAS_OK` de `quickstart.md` y 18 escenarios manuales. No hay framework de tests de UI.
**Plataforma objetivo:** navegador de escritorio y móvil, offline, abierto con `file://`.
**Metas de rendimiento:** cada cambio de capa en ≤ 1,2 s; sin volver a descargar una capa ya vista; cada imagen ≤ 7 905 335 bytes.
**Restricciones:** sin red en tiempo de ejecución, sin editar librerías de terceros, sin atajos nuevos aparte de ↑/↓, diff ≤ 300 líneas.

## Verificación de jerarquía

| Fuente | Regla o principio | Estado | Cómo se cumple |
| :--- | :--- | :-: | :--- |
| AGENTS.md | §1.1 Spec ejecutable | ✅ | Carpeta completa; queda en `DRAFT` hasta que el desarrollador apruebe |
| AGENTS.md | §1.2 Blast Radius (máx. 5) | ✅ | 5 archivos (ver tabla); el script y la caché de teselas van en `.harness/runs/`, que no cuenta |
| AGENTS.md | §1.4 Contratos inmutables | ✅ | No hay OpenAPI; los datos `wells.*` y `outfits.*` no se tocan |
| AGENTS.md | §1.5 Sin refactor no solicitado | ✅ | Solo se tocan `initMap`, `initCategoryMarkers`, `renderList`, `appliedFilters`, `updateStats`, `setCategory`, `bindEvents`, `start` y textos del reinicio |
| AGENTS.md | §5 Gates 5.1–5.3 | ✅ | Se ejecutan sin cambios; `CAPAS_OK` es una comprobación adicional, no sustituye a ninguno |
| AGENTS.md | §5 Verificación manual de UI | ✅ | `quickstart.md` §3, con registro en la bitácora |
| Reglas | `rules/security.md` §2 Sin instalar paquetes | ✅ | Pillow ya está instalado; no se instala nada |
| Reglas | `rules/security.md` §3 Consentimiento | ✅ | La descarga de unas 1440 teselas se ejecuta solo tras autorización explícita al arrancar T001 |
| Reglas | `rules/git-workflow.md` §1 Ramas | ✅ | `feat/ZEL-002-capas-cielo-profundidades`; nada en `main` |
| Reglas | `rules/git-workflow.md` §2 Diff ≤ 300 líneas | ✅ | Estimado unas 285 (R10); si se supera, se justifica en la bitácora |
| Reglas | `rules/testing-gates.md` §2 Paridad de pruebas | ✅ | Sin framework de UI (`AGENTS.md` §5); cobertura con escenarios manuales y `CAPAS_OK` |
| Contratos | `.harness/contracts/` | ✅ | No aplica: no hay API |
| Contexto | `system-overview.md` §2.1 Sin red | ✅ | Imágenes locales; gradientes CSS; `CAPAS_OK` y 5.3 |
| Contexto | `system-overview.md` §2.3 Persistencia tolerante | ✅ | `totk.map.layer.v1` dentro de `try/catch`, con `surface` por defecto |
| Contexto | `system-overview.md` §2.4 Escape de HTML | ✅ | Los textos de capa y estado vacío pasan por `escapeHtml()` |
| Contexto | `system-overview.md` §2.5 Terceros intocables | ✅ | Captura nativa en `document` en lugar de editar Leaflet (R5) |
| Contexto | `system-overview.md` §4 Mutación solo en `toggleWell`/`resetProgress` | ✅ | `setLayer` no cambia `found`; solo cambia la vista |
| Contexto | `system-overview.md` §5 IDs del DOM | ✅ | No se renombra ningún ID existente; solo se agregan |
| Contexto | `data-contracts.md` §3 Versionar claves | ✅ | Clave nueva `.v1`; las existentes intactas |
| Constitución | I. Capas en un solo lugar | ✅ | `LAYERS` en `app.js`; conteos calculados |
| Constitución | II. Un único camino | ✅ | `setLayer()` usado por teclado, botones y arranque (`applyLayer` sin animación) |
| Constitución | III. Animación nativa y acotada | ✅ | CSS `@keyframes` + gradientes; seguridad de 1200 ms; `prefers-reduced-motion` |
| Constitución | IV. Progreso intacto | ✅ | Sin migración |
| Constitución | V. Imágenes antes del código | ✅ | T001–T003 bloquean T004 en adelante |
| Constitución | VI. Verificación manual por capa | ✅ | `quickstart.md` §2 (`CAPAS_OK`) y §3 |

**Resultado:** PASS.

### Excepciones (solo constitución de la spec)

Ninguna.

## Cambios a contratos

No aplica: el proyecto no expone ni consume interfaces externas en tiempo de ejecución.

**Propuesta para el desarrollador (fuera del Blast Radius):** al cerrar, actualizar `.harness/context/data-contracts.md` §3 con la clave `totk.map.layer.v1` y `system-overview.md` §0, §1 y §5 con las capas y los IDs nuevos. Se deja redactado en la entrada `CIERRE` de la bitácora, igual que en ATU-001.

## Estructura

### Artefactos de la spec

```text
.harness/specs/ZEL-002/
├── spec.md
├── constitution.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

### Diseño por archivo

- **`proyecto/js/app.js`**
  - `LAYERS` + `layerIndex` + `STORAGE_LAYER = "totk.map.layer.v1"`; `loadLayer()` y `saveLayer()` con `try/catch`.
  - `layerOf(item)` devuelve `item.layer || "surface"`; se quita el filtro fijo de `CATEGORIES.outfits`.
  - `ensureOverlay(layer)`: crea el `L.imageOverlay` al primer uso, con `load` (ocultar loader) y `error` (`failed`, clase `map--no-image`, toast).
  - `applyLayer(index)` sin animación: cierra popup y selección, cambia el overlay, rellena el cluster activo con los marcadores de la capa (`clearLayers` + `addLayers`), y llama a `renderList`, `applyCategoryTexts`, `updateStats`, `appliedFilters`, `updateLayerControl`, `announceLayer` y `saveLayer`.
  - `setLayer(dir)`: valida límites (señal `is-bump` si no hay capa), aplica `layerBusy`, añade las clases de transición en `#layerTransition` (`is-ascending`/`is-descending` o `is-fading`), llama a `applyLayer` en el punto medio y libera el bloqueo en `animationend` o a los 1200 ms.
  - `renderList`, `updateStats` y `appliedFilters` iteran solo los elementos de la capa visible. El estado vacío muestra "No hay <plural> en <capa>".
  - `setCategory` también rellena el cluster de la nueva categoría con la capa visible.
  - `bindEvents`: `document.addEventListener("keydown", onLayerKey, true)` (R5, R7) y clics en `#layerUp`/`#layerDown`.
  - `start`: `applyLayer(loadLayer())` antes de pintar.
  - Texto del modal de reinicio: "Se borrará el progreso de <categoría> en las tres capas".
- **`proyecto/index.html`**: `nav.layer-switch` dentro del HUD con `#layerUp` (aria-label "Subir de capa"), `#layerName`, `#layerPos` y `#layerDown` (aria-label "Bajar de capa"); `<div id="layerTransition" class="layer-transition" aria-hidden="true">`; `<p id="layerStatus" class="sr-only" aria-live="polite">`. No se renombra ningún ID existente.
- **`proyecto/css/styles.css`**: estilos de `.layer-switch` (botones deshabilitados y `is-bump`); `.layer-transition` con `@keyframes layer-ascend-out/in` y `layer-descend-out/in`; nubes y brillo con `radial-gradient`; `.map--no-image`; `.sr-only` si no existe; `@media (prefers-reduced-motion: reduce)` con fundido de 300 ms.
- **`proyecto/assets/img/sky.jpg`** y **`proyecto/assets/img/depths.jpg`**: generados por el script de R3.

### Blast Radius preliminar

| Archivo | Tipo | Capa / módulo |
| :--- | :--- | :--- |
| `proyecto/assets/img/sky.jpg` | Creación | Activo: mapa del cielo |
| `proyecto/assets/img/depths.jpg` | Creación | Activo: mapa de profundidades |
| `proyecto/js/app.js` | Modificación | Lógica: capas, transición y teclado |
| `proyecto/index.html` | Modificación | Marcado: control de capas, superposición y `aria-live` |
| `proyecto/css/styles.css` | Modificación | Estilos: control, animaciones y movimiento reducido |

**Total:** 5 de 5 permitidos. No cuentan: `.harness/runs/ZEL-002/tools/stitch_tiles.py`, `.harness/runs/ZEL-002/tiles/`, `ground-check.jpg` (ignorados por git) ni los archivos de `.harness/specs/` y `.harness/memory/`.

## Plan de orquestación

- **Perfil:** frontend
- **Rama de ejecución sugerida:** A (agente simple). Son cinco archivos muy acoplados entre sí (IDs del DOM ↔ `app.js` ↔ clases CSS); un enjambre aumentaría el riesgo de que no coincidan.
- **Workers / capas:** imágenes (T001–T003) → marcado (T004) → estilos (T005) → lógica (T006–T009) → gates y verificación manual (T010–T011).
- **Workflow fijo:** script de unión de teselas con consentimiento; servidor local `python3 -m http.server` para la verificación en Chrome.

## Riesgos

- **Encuadre distinto entre capas:** si la comparación Ground ↔ `surface.jpg` no cuadra, se detiene en T002 y la spec pasa a `BLOCKED` (constitución V).
- **Peso de la imagen del cielo** (mucho océano de nubes con detalle): bajar la calidad JPEG hasta 75; si aún supera el límite, detener y consultar.
- **Disponibilidad o límites de la fuente:** retardo de 100 ms y caché local para reanudar sin repetir descargas; si hay errores 429 o 5xx persistentes, detener.
- **Diff cercano a 300 líneas:** mantener el CSS compacto; si se supera, justificarlo en la bitácora.
- **Términos de las imágenes:** la fuente no publica condiciones para el arte del juego; se documenta y el desarrollador decide (R4).
- **Escenario 15** (imagen ausente): se prueba renombrando el archivo en el servidor local y se restaura de inmediato; no se deja ningún cambio fuera del Blast Radius.
