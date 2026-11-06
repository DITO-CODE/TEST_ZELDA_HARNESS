# Investigación: ZEL-002 Mapas del cielo y de las profundidades

Fecha: 2026-11-06. Una entrada por decisión: Decisión, Razón y Alternativas consideradas.

## R1. Fuente de las imágenes de cielo y profundidades

- **Decisión:** usar las teselas del *TotK Object Map* de ZeldaMods, nivel de zoom 5:
  - Cielo: `https://objmap-totk.zeldamods.org/game_files/map/Sky/maptex/5/{x}/{y}.webp`
  - Profundidades: `https://objmap-totk.zeldamods.org/game_files/map/Depths/maptex/5/{x}/{y}.webp`
  - Control (superficie): `https://objmap-totk.zeldamods.org/game_files/map/Ground/maptex/5/{x}/{y}.webp`
- **Razón:** es la misma fuente que los datos de pozos y atuendos (lección LL-001 de ATU-001), y las tres capas comparten el sistema de coordenadas (`MAP_SIZE = [24000, 20000]` px en el zoom nativo 7, coordenadas de juego ±6000 × ±5000, `src/util/map.ts` y `src/MapBase.ts` del repositorio `zeldamods/objmap-totk`). Comprobado el 2026-11-06 con peticiones HEAD: `5/0/0`, `5/12/10` y `5/23/19` responden 200 en las tres capas; `5/24/0` y `5/0/20` responden 404. Es decir, una cuadrícula de 24 × 20 teselas de 256 px.
- **Alternativas consideradas:**
  - `game_files/maptex/base.png`: es un relleno de baja calidad común a todas las capas, no el mapa de cada capa.
  - Que el desarrollador aporte las imágenes: lo descartó en `specflow-specify`.
  - Fondo provisional sin imagen real: no cumple RF-002 ni CE-003.

## R2. Resolución y encuadre de las imágenes

- **Decisión:** unir las 480 teselas del zoom 5 (24 × 20) en un lienzo de 6144 × 5120 px y recortarlo a **6000 × 5000 px** desde la esquina superior izquierda. Exportar a JPEG con calidad 85 y bajar la calidad (mínimo 75) si se supera el peso de `surface.jpg` (7 905 335 bytes).
- **Razón:** con la transformación de objmap (`4 / 256` por unidad en zoom 0), el zoom 5 da 0,5 px por unidad: 12 000 × 10 000 unidades dan 6000 × 5000 px, exactamente el tamaño de `surface.jpg`. El origen de las teselas es la esquina (−6000, −5000), así que el recorte desde arriba a la izquierda conserva `MAP_BOUNDS` sin cambios.
- **Verificación (constitución V):** se unen también las teselas `Ground` del zoom 5 y se comparan con `surface.jpg`. El error medio absoluto por canal debe ser bajo (< 12 de 255) y sin desplazamiento visible en las esquinas. Así queda demostrado que el encuadre coincide antes de usar cielo y profundidades. Después se recorta alrededor de los atuendos `0051` (cielo) y `0057` (profundidades), en el píxel `col = 0,5·(y+6000)`, `fila = 0,5·(5000−x)`, para revisar a ojo que caen sobre terreno coherente (isla o cofre de profundidades).
- **Alternativas consideradas:**
  - Zoom 6 (12 000 × 10 000 px): demasiado pesado (incumple RNF-003).
  - Zoom 4 (3000 × 2500 px): se ve borroso respecto a la superficie.
  - Servir las teselas como `L.tileLayer` local: 480 archivos por capa rompen el Blast Radius y complican el modo `file://`.

## R3. Herramienta para unir las teselas

- **Decisión:** un script Python de un solo uso con Pillow 12.3 (instalado, con soporte webp) en `.harness/runs/ZEL-002/tools/stitch_tiles.py`. Descarga con un retardo de 100 ms entre peticiones y reintento simple, guarda la caché de teselas en `.harness/runs/ZEL-002/tiles/` y escribe el JPEG final en `proyecto/assets/img/`.
- **Razón:** `.harness/runs/` está en `.gitignore` y no cuenta para el Blast Radius; no se instala ningún paquete (`security.md` §2). Las descargas requieren consentimiento explícito del desarrollador al arrancar la tarea (`security.md` §3, constitución V).
- **Alternativas consideradas:** `sips` (lee webp pero no compone mosaicos) e ImageMagick (no está instalado).

## R4. Licencia y condiciones de uso

- **Decisión:** registrar en la bitácora la fuente (URL de las teselas), el repositorio `zeldamods/objmap-totk` (GPL-3.0, que cubre el código y no menciona las imágenes) y que las imágenes son arte del juego propiedad de Nintendo, usado para una guía no comercial, igual que `surface.jpg`. Además, agregar la atribución "Mapas: ZeldaMods TotK Object Map" en el control de atribución del mapa.
- **Razón:** RNF-005. La fuente no publica términos explícitos para las imágenes; se documenta para que el desarrollador decida.
- **Alternativas consideradas:** ninguna con imágenes oficiales libres de derechos.

## R5. Flechas ↑/↓ frente al teclado de Leaflet

- **Decisión:** registrar un `keydown` nativo en fase de captura sobre `document` (`addEventListener(..., true)`, compatible con ES5) que, para `ArrowUp` y `ArrowDown` fuera de campos de texto y sin diálogo abierto, llame a `preventDefault()` y `stopPropagation()` y pida el cambio de capa. ← y → siguen llegando a Leaflet.
- **Razón:** el manejador de teclado de Leaflet escucha en el contenedor del mapa. Detener la propagación en captura evita que desplace el mapa en vertical, sin tocar la librería (restricción de la constitución) y sin desactivar `keyboard` por completo, lo que quitaría también ← → y +/−.
- **Alternativas consideradas:**
  - `keyboard: false`: elimina todo el teclado del mapa.
  - Editar `L.Map.Keyboard._panKeys`: es una API privada.
  - Manejador jQuery en burbuja: llega después de Leaflet.

## R6. Animación de ascenso y descenso

- **Decisión:** una capa superpuesta propia (`#layerTransition`) sobre el mapa, con dos `@keyframes` CSS por sentido y dos fases de unos 480 ms cada una:
  1. **Salida:** el mapa se desplaza y escala (sube: `translateY(+8%)` y aclarado; baja: `translateY(−8%)`, escala 1,04 y oscurecido).
  2. **Cambio de capa** en el punto medio, con la superposición opaca: blanco cálido con nubes al subir; casi negro con brillo rojizo tenue al bajar.
  3. **Entrada:** la nueva capa aparece desde el sentido opuesto.

  Las nubes y el brillo se dibujan con gradientes CSS (`radial-gradient`), sin imágenes. Un temporizador de seguridad de 1200 ms libera el bloqueo aunque no llegue `animationend`. Con `prefers-reduced-motion: reduce`, solo hay un fundido de opacidad de 300 ms.
- **Razón:** constitución III (nativa, original, ≤ 1,2 s, siempre deja el mapa usable), RF-008, RF-009 y CE-001.
- **Alternativas consideradas:**
  - Animar solo el contenedor de Leaflet: el cambio de `imageOverlay` se vería a mitad de la animación.
  - Una librería de animación: prohibido.

## R7. Bloqueo de entradas y diálogos

- **Decisión:** un indicador `layerBusy` dentro de la operación única de cambio de capa (constitución II). Las flechas se ignoran si `event.repeat` es verdadero, si el foco está en `input`, `textarea` o `select`, si `#resetModal` tiene `is-open`, o si el panel lateral está abierto en modo móvil (`#sidebar.is-open` con el fondo `#backdrop` visible).
- **Razón:** RF-004, RF-010 y los casos límite de mantener la tecla pulsada y de los diálogos abiertos.
- **Alternativas consideradas:** una cola de cambios de capa (contradice RF-010).

## R8. Overlays y caché de imágenes

- **Decisión:** un `L.imageOverlay` por capa, creado al primer uso y reutilizado (se quita y se vuelve a añadir). Mientras carga se muestra `#mapLoader`. Si dispara `error`, se pone un fondo neutro con la clase `map--no-image` y un toast "No se pudo cargar el mapa de <capa>"; los marcadores siguen visibles.
- **Razón:** RNF-002 (sin volver a descargar) y el caso límite de la imagen que no carga.
- **Alternativas consideradas:** `setUrl()` sobre un solo overlay (el navegador vuelve a decodificar en cada cambio y no permite distinguir el error por capa).

## R9. Marcadores por capa

- **Decisión:** se conserva un cluster por categoría. Al cambiar de capa se vacía (`clearLayers`) y se llena con los marcadores ya creados de la categoría cuya capa sea la visible. La capa de cada elemento es `item.layer` o, si no tiene, `"surface"` (pozos). Se elimina el filtro fijo `layer === "surface"` de `CATEGORIES.outfits`.
- **Razón:** constitución I (pertenencia derivada de los datos, sin conteos a mano) y RF-011 a RF-013.
- **Alternativas consideradas:** un cluster por categoría y capa (seis clusters, más estado sin beneficio).

## R10. Estimación del diff

- **Decisión:** objetivo ≤ 300 líneas modificadas: `app.js` ≈ 130, `styles.css` ≈ 130, `index.html` ≈ 25. Las imágenes son binarias y no suman líneas.
- **Razón:** `git-workflow.md` §2 (límite de líneas).
- **Alternativas consideradas:** si se supera, se registra en la bitácora con su justificación, como en ATU-001.
