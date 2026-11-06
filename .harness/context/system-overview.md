# Contexto del Sistema y Topología de Componentes

Este proyecto es para generar mapas de guia de los diferentes items y easter eggs del juego Zelda Tears of the Kindom.

## 0. Propósito y Alcance Actual

<!-- Fuente: grafo de graphify (`graphify-out/graph.json`, 2026-11-06) contrastado con el código. Mantén este archivo como un mapa breve, no como un volcado de documentación. -->

- **Visión:** guía interactiva para localizar y marcar coleccionables y easter eggs sobre el mapa de Hyrule.
- **Implementado hoy:** una sola colección, los **58 pozos de Tears of the Kingdom** (`data/wells.*`, fuente: ZeldaMods / TotK Object Map), sobre el mapa de superficie de TotK (`assets/img/surface.jpg`). No hay otras categorías, capas ni mapas (cielo o profundidades).
- **Qué está acoplado a "pozos"** (lo que habría que generalizar para agregar otra categoría de ítems):
  - Datos: `window.TOTK_WELLS` y la constante `WELLS` en `js/app.js`.
  - Persistencia: clave `totk.wells.found.v1` (cambiarla exige migración, ver `data-contracts.md`).
  - Marcado: el total `58` está escrito a mano en `index.html` (`#totalCount`, `#chipAll`, `#chipPending`, `aria-valuemax`, `<meta description>`); `updateStats()` lo corrige en tiempo de ejecución, pero el HTML inicial lo muestra.
  - Textos de UI y toasts en `app.js` hablan de "pozo/pozos".
  - Íconos: `pendingIcon` / `foundIcon` (gota de agua) son específicos de pozos.
- **Regla para specs nuevas:** agregar una categoría de ítems es un cambio de varios archivos (datos, `app.js`, `index.html`, `styles.css`, contrato). Divídelo en sub-specs si supera el límite de 5 archivos.

## 1. Topología del Repositorio

Aplicación web estática, sin backend ni paso de build, para localizar y marcar los 58 pozos de Hyrule (Zelda: Tears of the Kingdom). El progreso se guarda en `localStorage` del navegador.

- **Stack:** HTML5, CSS, JavaScript (ES5, IIFE con `"use strict"`), jQuery y Leaflet con Leaflet.markercluster. Las librerías están vendorizadas; no hay `package.json` ni CDN.
- **`proyecto/index.html`**: Única página. Contiene el marcado del panel lateral, el mapa, el HUD, el toast y el modal de reinicio. Orden de carga de scripts: `js/jquery.min.js` → `js/leaflet.js` → `js/leaflet.markercluster.js` → `data/wells.js` → `js/app.js`.
- **`proyecto/js/app.js`**: Toda la lógica de la aplicación (mapa `L.CRS.Simple`, marcadores y clusters, lista, búsqueda, filtros, progreso, persistencia, modal, atajos de teclado).
- **`proyecto/js/jquery.min.js`, `leaflet.js`, `leaflet.markercluster.js`**: Librerías de terceros. No se modifican.
- **`proyecto/css/styles.css`**: Estilos propios. `leaflet.css`, `MarkerCluster.css` y `css/images/` son de terceros.
- **`proyecto/data/wells.json`**: Datos de los pozos (fuente legible).
- **`proyecto/data/wells.js`**: Los mismos datos expuestos como `window.TOTK_WELLS`. Es el archivo que realmente carga la app (permite abrir `index.html` con `file://` sin servidor).
- **`proyecto/assets/img/surface.jpg`**: Imagen del mapa de superficie usada como `L.imageOverlay`.
- **`proyecto/assets/fonts/cinzel-latin.woff2`**: Tipografía local.

---

## 2. Invariantes Arquitectónicos

1. **Sin red en tiempo de ejecución:** La app funciona offline y desde `file://`. No agregar dependencias por CDN ni llamadas `fetch` a recursos externos.
2. **Datos sincronizados:** `data/wells.json` y `data/wells.js` deben contener exactamente los mismos registros. Si cambia uno, cambia el otro en la misma spec.
3. **Persistencia tolerante a fallos:** Todo acceso a `localStorage` va dentro de `try/catch` y la app debe funcionar si el almacenamiento falla o devuelve basura.
4. **Escape de HTML:** Todo texto proveniente de los datos se inserta con `escapeHtml()`.
5. **Librerías de terceros intocables:** No editar `jquery.min.js`, `leaflet*.js`, `leaflet.css` ni `MarkerCluster.css`.
6. **Manejo de Secretos:** Jamás hardcodear tokens ni claves en el código fuente.

---

## 3. Mapa de Dependencias Críticas

| Módulo | Depende de | Prohibido depender de |
| :--- | :--- | :--- |
| `js/app.js` | jQuery, Leaflet, markercluster, `window.TOTK_WELLS` | Recursos remotos (CDN, APIs) |
| `data/wells.js` | Nada | Cualquier script |
| `css/styles.css` | `assets/fonts/` | Recursos remotos |

---

## 4. Flujo de Ejecución de `js/app.js`

<!-- Fuente: grafo de graphify (`graphify-out/graph.json`, 2026-11-06), contrastado con el código. Aristas `calls` = EXTRACTED por AST; las marcadas (inf.) son INFERRED. -->

Arranque (`$(start)` al cargar el DOM):

```text
start()
├── initMap()        → loadView(), imageOverlay(assets/img/surface.jpg), hideLoader()
│                      eventos: moveend → saveView() (debounce 220 ms), click → clearSelection()
├── initMarkers()    → L.markerClusterGroup + un L.marker por pozo; popupHtml(), setSelected(), clearSelection()
├── renderList()     → escapeHtml(), formatCoord()
├── bindEvents()     → delegación jQuery sobre data-* y controles del panel
├── updateStats()    → progressMessage()
└── appliedFilters() → normalize()
```

Funciones de mutación de estado (las únicas que escriben en `localStorage` mediante `saveFound()`):

| Función | Llama a | Efecto |
| :--- | :--- | :--- |
| `toggleWell(id)` | `saveFound`, `popupHtml`, `updateListState`, `updateStats`, `appliedFilters`, `showToast` | Marca/desmarca un pozo y refresca marcador, cluster, lista, contadores y toast. |
| `resetProgress()` | `saveFound`, `popupHtml`, `updateListState`, `updateStats`, `appliedFilters`, `closeResetModal`, `showToast` | Vacía `foundIds` y repinta todo. |

Regla: cualquier cambio de estado de un pozo debe pasar por `toggleWell()` o `resetProgress()` para mantener sincronizados mapa, lista y contadores. No dupliques esa secuencia en otra función.

Selección: `focusWell()` → `setSelected()` → `removeSelectedClass()`; `clearSelection()` → `removeSelectedClass()`.

---

## 5. Acoplamiento DOM ↔ Funciones

`app.js` depende de IDs y atributos fijos de `index.html`. Renombrar un ID sin actualizar `app.js` rompe la UI en silencio (jQuery no falla con selectores vacíos).

| Región de `index.html` | IDs / atributos | Función que la usa |
| :--- | :--- | :--- |
| Mapa | `#map`, `#mapLoader` | `initMap()` |
| Progreso (panel) | `#foundCount`, `#totalCount`, `#progressBar`, `#progressFill`, `#progressMessage` | `updateStats()` |
| HUD del mapa | `#hudFound`, `#hudTotal`, `#openSidebar` | `updateStats()`, `bindEvents()` |
| Búsqueda | `#searchInput` (atajo `/`, `Escape` limpia) | `bindEvents()` → `appliedFilters()` |
| Filtros | `.filter[data-filter]`, `#chipAll`, `#chipPending`, `#chipFound` | `bindEvents()`, `updateStats()` |
| Lista | `#wellList`, `#emptyState`, `#visibleCount`, `.well-item[data-id]` | `renderList()`, `appliedFilters()`, `updateListState()` |
| Acciones | `[data-focus-well]`, `[data-toggle-well]`, `[data-center-well]` | `bindEvents()` (delegado en `document`) |
| Panel lateral | `#sidebar`, `#closeSidebar`, `#backdrop` | `openSidebar()`, `closeSidebar()` |
| Reinicio | `#resetBtn`, `#resetModal`, `#confirmReset`, `[data-close-modal]` | `openResetModal()`, `closeResetModal()`, `resetProgress()` |
| Notificación | `#toast` | `showToast()` |

Hay tres flujos que cruzan HTML y JS y conviene tratar como unidad al especificar cambios:

1. **Contadores de progreso:** panel, HUD y chips de filtro se actualizan juntos desde `updateStats()`.
2. **Reinicio:** `#resetBtn` → `#resetModal` → `resetProgress()` → `localStorage`.
3. **Render del mapa:** Leaflet + MarkerCluster + `window.TOTK_WELLS` + `#map` + `initMap()`.

---

## 6. Activos y Notas del Grafo

- `assets/img/surface.jpg`: mapa topográfico sepia de la superficie de Hyrule; se usa como `L.imageOverlay` sobre `MAP_BOUNDS`.
- `css/images/*.png` (`marker-icon`, `marker-icon-2x`, `marker-shadow`, `layers`, `layers-2x`): íconos por defecto de Leaflet, referenciados solo desde `css/leaflet.css`. La app usa `L.divIcon` propios, así que los íconos de marcador no se usan en tiempo de ejecución. No los borres: forman parte de la librería vendorizada.
- Puntos calientes según el grafo: `bindEvents()` (16 conexiones), `resetProgress()` (11), `toggleWell()` (10) e `initMap()` (9). Un cambio en ellos tiene el mayor radio de impacto.
- Para regenerar este análisis tras cambios: `/graphify proyecto --update`.
