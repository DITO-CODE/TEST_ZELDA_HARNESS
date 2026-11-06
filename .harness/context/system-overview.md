# Contexto del Sistema y Topología de Componentes

Guía interactiva para localizar y marcar coleccionables y easter eggs de *Zelda: Tears of the Kingdom* sobre el mapa de Hyrule. Mantén este archivo como un mapa breve, no como un volcado de documentación.

<!-- Fuente: código de `proyecto/` (2026-11-06) y grafo de graphify en `graphify-out/`. -->

## 0. Propósito y Alcance Actual

- **Implementado hoy:** tres capas de mapa (Cielo, Superficie y Profundidades), navegables con ↑/↓ o con el control de capas, y dos categorías:
  - **Pozos** (`data/wells.*`, `window.TOTK_WELLS`, 58 registros, solo en Superficie).
  - **Atuendos** (`data/outfits.*`, `window.TOTK_OUTFITS`, 85 registros: 7 en Cielo, 48 en Superficie y 30 en Profundidades).
- La lista, la búsqueda, los filtros y los contadores muestran solo la capa visible. El reinicio de progreso borra la categoría completa (todas las capas).
- **No existen** otras categorías ni vistas superpuestas de varias capas.
- **Agregar una categoría** es un cambio de varios archivos: datos (`.json` + `.js`), `<script>` en `index.html`, una entrada en `CATEGORIES` de `app.js`, estilos del marcador en `styles.css` y el contrato en `data-contracts.md` y en el gate 5.2 de `AGENTS.md`. Divídelo en sub-specs si supera el límite de 5 archivos. Si sus registros no traen `layer`, se consideran de Superficie.
- **Agregar una capa** exige una imagen en `assets/img/` (ver `data-contracts.md` §4) y una entrada en `LAYERS` de `app.js`; el orden de `LAYERS` es el orden vertical (arriba → abajo).

## 1. Topología del Repositorio

Aplicación web estática, sin backend ni paso de build. El progreso se guarda en `localStorage`.

- **Stack:** HTML5, CSS, JavaScript ES5 (IIFE con `"use strict"`), jQuery, Leaflet y Leaflet.markercluster, vendorizados. Sin `package.json` ni CDN.
- **`proyecto/index.html`**: única página (panel lateral con selector de categoría, mapa, HUD, toast y modal de reinicio). Orden de carga: `js/jquery.min.js` → `js/leaflet.js` → `js/leaflet.markercluster.js` → `data/wells.js` → `data/outfits.js` → `js/app.js`.
- **`proyecto/js/app.js`**: toda la lógica (mapa `L.CRS.Simple`, categorías, marcadores y clusters, lista, búsqueda, filtros, progreso, persistencia, modal, atajos de teclado).
- **`proyecto/js/jquery.min.js`, `leaflet.js`, `leaflet.markercluster.js`**: terceros, no se modifican.
- **`proyecto/css/styles.css`**: estilos propios. `leaflet.css`, `MarkerCluster.css` y `css/images/` son de terceros.
- **`proyecto/data/*.json`**: fuente legible de cada categoría. **`proyecto/data/*.js`**: los mismos datos como `window.TOTK_*`; es lo que carga la app (permite abrirla con `file://`).
- **`proyecto/assets/img/sky.jpg`, `surface.jpg`, `depths.jpg`**: un overlay por capa (6000 × 5000 px sobre `MAP_BOUNDS`), cargado al primer uso y reutilizado. **`proyecto/assets/fonts/cinzel-latin.woff2`**: tipografía local.

---

## 2. Invariantes Arquitectónicos

1. **Sin red en tiempo de ejecución:** la app funciona offline y desde `file://`. Nada por CDN ni `fetch` a recursos externos.
2. **Datos sincronizados:** cada `data/<categoría>.json` y su `.js` contienen exactamente los mismos registros. Si cambia uno, cambia el otro en la misma spec.
3. **Persistencia tolerante a fallos:** todo acceso a `localStorage` va en `try/catch`; la app funciona si el almacenamiento falla o devuelve basura.
4. **Escape de HTML:** todo texto proveniente de los datos se inserta con `escapeHtml()`.
5. **Librerías de terceros intocables:** no editar `jquery.min.js`, `leaflet*.js`, `leaflet.css`, `MarkerCluster.css` ni `css/images/`.
6. **Manejo de secretos:** jamás hardcodear tokens ni claves.

---

## 3. Mapa de Dependencias Críticas

| Módulo | Depende de | Prohibido depender de |
| :--- | :--- | :--- |
| `js/app.js` | jQuery, Leaflet, markercluster, `window.TOTK_WELLS`, `window.TOTK_OUTFITS` | Recursos remotos (CDN, APIs) |
| `data/*.js` | Nada | Cualquier script |
| `css/styles.css` | `assets/fonts/` | Recursos remotos |

---

## 4. Flujo de Ejecución de `js/app.js`

- **Categorías:** `CATEGORIES` (`wells`, `outfits`) se construye con `makeCategory()`, que filtra, ordena por `id`, indexa en `byId`, carga los encontrados (`loadFound()`) y crea los íconos (`markerIcon()`). `active` apunta a la categoría visible; se cambia con `setCategory()`.
- **Arranque (`start()`):** `initMap()` → `initMarkers()` (crea los marcadores de cada categoría con `initCategoryMarkers()`; el cluster se llena por capa) → `bindEvents()` → `applyLayer(loadLayer())`.
- **Capas:** `LAYERS` (`sky`, `surface`, `depths`), `layerIndex` y `layerOf(item)` (`item.layer` o `"surface"`).
  - `applyLayer(index)`: cambio sin animación. Cierra popup y selección, cambia el overlay (`ensureOverlay()`), rellena el cluster de la categoría activa con `fillCluster()`, refresca lista, textos, contadores y filtros, y guarda la capa (`saveLayer()`).
  - `setLayer(dir)`: única entrada interactiva (teclado y botones). Valida los límites (`bumpLayer()`), bloquea con `layerBusy`, reproduce la transición y llama a `applyLayer` a los 480 ms; libera a los 960 ms (300 ms con movimiento reducido).
  - `onLayerKey`: `keydown` nativo en **fase de captura** sobre `document`. Intercepta ↑/↓ antes que Leaflet; se ignora en campos de texto, con el modal abierto o con el panel móvil abierto.
  - `setCategory()` también llama a `fillCluster()` para mostrar la capa visible.
- **Mutación de estado:** solo `toggleWell(id)` y `resetProgress()` cambian `active.found` y llaman a `saveFound()`. Ambas refrescan marcador, cluster, lista, contadores y toast. No dupliques esa secuencia en otra función.
- **Selección:** `focusWell()` → `setSelected()` → `removeSelectedClass()`; `clearSelection()` → `removeSelectedClass()`.
- **Puntos calientes** (mayor radio de impacto): `bindEvents()`, `toggleWell()`, `resetProgress()`, `setCategory()`, `applyLayer()` e `initMap()`.

---

## 5. Acoplamiento DOM ↔ Funciones

`app.js` depende de IDs y atributos fijos de `index.html`. Renombrar uno sin actualizar `app.js` rompe la UI en silencio (jQuery no falla con selectores vacíos).

| Región de `index.html` | IDs / atributos | Función que la usa |
| :--- | :--- | :--- |
| Mapa | `#map`, `#mapLoader` (se oculta y se vuelve a mostrar, no se elimina) | `initMap()`, `setLoader()` |
| Categoría | `.category-switch [data-category]`, `#brandTitle`, `#listTitle`, `#hudLabel`, `#resetTitle`, `#resetScope` | `setCategory()`, `applyCategoryTexts()` |
| Capas | `.layer-switch` (`is-bump`), `#layerUp`, `#layerDown`, `#layerName`, `#layerPos`, `body[data-layer]` | `setLayer()`, `bumpLayer()`, `updateLayerControl()` |
| Transición y anuncio | `#layerTransition` (`is-ascending`, `is-descending`, `is-fading`), `#map` (`is-layer-*`, `map--no-image`), `#layerStatus` (`aria-live`) | `setLayer()`, `applyLayer()`, `ensureOverlay()` |
| Progreso | `#foundCount`, `#totalCount`, `#progressBar`, `#progressFill`, `#progressMessage` | `updateStats()` |
| HUD | `#hudFound`, `#hudTotal`, `#openSidebar` | `updateStats()`, `bindEvents()` |
| Búsqueda | `#searchInput` (atajo `/`, `Escape` limpia) | `bindEvents()` → `appliedFilters()` |
| Filtros | `.filter[data-filter]`, `#chipAll`, `#chipPending`, `#chipFound` | `bindEvents()`, `updateStats()` |
| Lista | `#wellList`, `#listScroll`, `#emptyState`, `#visibleCount`, `.well-item[data-id]` | `renderList()`, `appliedFilters()`, `updateListState()` |
| Acciones | `[data-focus-well]`, `[data-toggle-well]`, `[data-center-well]` | `bindEvents()` (delegado en `document`) |
| Panel lateral | `#sidebar`, `#closeSidebar`, `#backdrop` | `openSidebar()`, `closeSidebar()` |
| Reinicio | `#resetBtn`, `#resetModal`, `#confirmReset`, `[data-close-modal]` | `openResetModal()`, `closeResetModal()`, `resetProgress()` |
| Notificación | `#toast` | `showToast()` |

Flujos que cruzan HTML y JS y se especifican como unidad:

1. **Cambio de categoría:** `[data-category]` → `setCategory()` → textos, lista, cluster visible y contadores.
2. **Cambio de capa:** ↑/↓ o `#layerUp`/`#layerDown` → `setLayer()` → `#layerTransition` → `applyLayer()` → overlay, cluster, lista, contadores, control y `totk.map.layer.v1`.
3. **Contadores de progreso:** panel, HUD y chips se actualizan juntos desde `updateStats()`, con los elementos de la capa visible.
4. **Reinicio:** `#resetBtn` → `#resetModal` → `resetProgress()` → `localStorage` (la categoría activa completa, en todas las capas).
5. **Render del mapa:** Leaflet + MarkerCluster + `window.TOTK_*` + `#map` + `initMap()` + `ensureOverlay()`.
