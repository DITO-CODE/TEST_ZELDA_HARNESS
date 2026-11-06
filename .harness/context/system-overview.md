# Contexto del Sistema y Topología de Componentes

Guía interactiva para localizar y marcar coleccionables y easter eggs de *Zelda: Tears of the Kingdom* sobre el mapa de Hyrule. Mantén este archivo como un mapa breve, no como un volcado de documentación.

<!-- Fuente: código de `proyecto/` (2026-11-06) y grafo de graphify en `graphify-out/`. -->

## 0. Propósito y Alcance Actual

- **Implementado hoy:** dos categorías sobre el mapa de superficie (`assets/img/surface.jpg`):
  - **Pozos** (`data/wells.*`, `window.TOTK_WELLS`, 58 registros).
  - **Atuendos** (`data/outfits.*`, `window.TOTK_OUTFITS`, 85 registros). Solo se muestran los de `layer: "surface"`; los de `sky` y `depths` existen en los datos pero no hay mapa para ellos.
- **No existen** mapas de cielo ni de profundidades, ni otras categorías.
- **Agregar una categoría** es un cambio de varios archivos: datos (`.json` + `.js`), `<script>` en `index.html`, una entrada en `CATEGORIES` de `app.js`, estilos del marcador en `styles.css` y el contrato en `data-contracts.md` y en el gate 5.2 de `AGENTS.md`. Divídelo en sub-specs si supera el límite de 5 archivos.

## 1. Topología del Repositorio

Aplicación web estática, sin backend ni paso de build. El progreso se guarda en `localStorage`.

- **Stack:** HTML5, CSS, JavaScript ES5 (IIFE con `"use strict"`), jQuery, Leaflet y Leaflet.markercluster, vendorizados. Sin `package.json` ni CDN.
- **`proyecto/index.html`**: única página (panel lateral con selector de categoría, mapa, HUD, toast y modal de reinicio). Orden de carga: `js/jquery.min.js` → `js/leaflet.js` → `js/leaflet.markercluster.js` → `data/wells.js` → `data/outfits.js` → `js/app.js`.
- **`proyecto/js/app.js`**: toda la lógica (mapa `L.CRS.Simple`, categorías, marcadores y clusters, lista, búsqueda, filtros, progreso, persistencia, modal, atajos de teclado).
- **`proyecto/js/jquery.min.js`, `leaflet.js`, `leaflet.markercluster.js`**: terceros, no se modifican.
- **`proyecto/css/styles.css`**: estilos propios. `leaflet.css`, `MarkerCluster.css` y `css/images/` son de terceros.
- **`proyecto/data/*.json`**: fuente legible de cada categoría. **`proyecto/data/*.js`**: los mismos datos como `window.TOTK_*`; es lo que carga la app (permite abrirla con `file://`).
- **`proyecto/assets/img/surface.jpg`** (overlay del mapa) y **`proyecto/assets/fonts/cinzel-latin.woff2`** (tipografía local).

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
- **Arranque (`start()`):** `initMap()` → `initMarkers()` (un cluster por categoría con `initCategoryMarkers()`) → `renderList()` → `bindEvents()` → `updateStats()` / `appliedFilters()`.
- **Mutación de estado:** solo `toggleWell(id)` y `resetProgress()` cambian `active.found` y llaman a `saveFound()`. Ambas refrescan marcador, cluster, lista, contadores y toast. No dupliques esa secuencia en otra función.
- **Selección:** `focusWell()` → `setSelected()` → `removeSelectedClass()`; `clearSelection()` → `removeSelectedClass()`.
- **Puntos calientes** (mayor radio de impacto): `bindEvents()`, `toggleWell()`, `resetProgress()`, `setCategory()` e `initMap()`.

---

## 5. Acoplamiento DOM ↔ Funciones

`app.js` depende de IDs y atributos fijos de `index.html`. Renombrar uno sin actualizar `app.js` rompe la UI en silencio (jQuery no falla con selectores vacíos).

| Región de `index.html` | IDs / atributos | Función que la usa |
| :--- | :--- | :--- |
| Mapa | `#map`, `#mapLoader` | `initMap()` |
| Categoría | `.category-switch [data-category]`, `#brandTitle`, `#listTitle`, `#hudLabel`, `#resetTitle`, `#resetScope` | `setCategory()`, `applyCategoryTexts()` |
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
2. **Contadores de progreso:** panel, HUD y chips se actualizan juntos desde `updateStats()`.
3. **Reinicio:** `#resetBtn` → `#resetModal` → `resetProgress()` → `localStorage` (solo la categoría activa).
4. **Render del mapa:** Leaflet + MarkerCluster + `window.TOTK_*` + `#map` + `initMap()`.
