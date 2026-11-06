# Contratos de Datos e Invariantes de Negocio

El proyecto no tiene backend ni API, así que no hay contratos OpenAPI en `.harness/contracts/`. Los contratos son los archivos de datos estáticos de `proyecto/data/` y las claves de `localStorage`. El gate 5.2 de `AGENTS.md` los verifica.

## 1. Reglas Comunes a Todas las Categorías

1. **Dos archivos por categoría:** `data/<categoría>.json` (fuente legible) y `data/<categoría>.js` (`window.TOTK_<CATEGORÍA> = [...];`) con exactamente los mismos registros y en el mismo orden.
2. **`id`:** string de 4 dígitos con sufijo opcional de una mayúscula (`^\d{4}[A-Z]?$`), único dentro de la categoría. Es la clave de persistencia: no se renumera.
3. **`name`:** string, en inglés tal como aparece en la fuente. La UI lo inserta con `escapeHtml()`.
4. **Coordenadas `x`, `y`, `z`:** números finitos en unidades del juego. `|x| ≤ 5000` y `|y| ≤ 6000` (`MAP_BOUNDS` de `app.js`). `z` es la altura y solo se muestra.
5. **Sin campos de más:** el conjunto de claves de cada registro es exactamente el de su categoría.
6. **Nomenclatura:** claves JSON en minúscula de una palabra; variables de `app.js` en `camelCase` y constantes en `UPPER_SNAKE_CASE`.

---

## 2. Esquemas por Categoría

| Categoría | Archivos | Global | Claves exactas | Enumerados |
| :--- | :--- | :--- | :--- | :--- |
| Pozos | `data/wells.json`, `data/wells.js` | `window.TOTK_WELLS` | `id, name, x, y, z` | — |
| Atuendos | `data/outfits.json`, `data/outfits.js` | `window.TOTK_OUTFITS` | `id, name, set, slot, layer, x, y, z` | `slot`: `head` \| `body` \| `legs`; `layer`: `surface` \| `sky` \| `depths`; `set`: string (puede ser `""`) |

**Capa de un registro:** es el valor de `layer`; si la categoría no tiene ese campo (pozos), es `surface`. Los valores de `layer` deben coincidir con las claves de `LAYERS` en `app.js`. Los conteos por capa se calculan en tiempo de ejecución y nunca se escriben a mano (hoy: atuendos 7 / 48 / 30, pozos 0 / 58 / 0).

Ejemplo de atuendo:

```json
{ "id": "0001", "name": "Barbarian Armor", "set": "", "slot": "body", "layer": "surface", "x": 819.64, "y": 632.05, "z": 133.11 }
```

---

## 3. Persistencia en `localStorage`

| Clave | Contenido |
| :--- | :--- |
| `totk.wells.found.v1` | Array JSON de `id` de pozos encontrados. |
| `totk.outfits.found.v1` | Array JSON de `id` de atuendos encontrados. |
| `totk.wells.view.v1` | `{ lat, lng, zoom }` de la última vista del mapa. |
| `totk.map.layer.v1` | String JSON con la última capa vista: `"sky"` \| `"surface"` \| `"depths"`. Un valor inválido, un error de lectura o la ausencia de la clave abren en `surface`. |

- Al cargar se descartan los `id` que no existan en los datos actuales.
- Cambiar el formato o el nombre de una clave exige subir la versión (`.v2`) y migrar en la misma spec los datos de la clave anterior, sin perder el progreso del usuario.

---

## 4. Origen de los Datos

- Fuente: ZeldaMods (TotK Object Map). Antes de regenerar datos, verifica la conversión de coordenadas contra un registro conocido y deja la evidencia en la bitácora.
- **Imágenes de mapa** (`assets/img/{sky,surface,depths}.jpg`): teselas del zoom 5 de `https://objmap-totk.zeldamods.org/game_files/map/{Sky|Ground|Depths}/maptex/5/{x}/{y}.webp` (24 × 20 teselas de 256 px), unidas y recortadas a 6000 × 5000 px desde la esquina superior izquierda; cubren exactamente `MAP_BOUNDS`. Cada imagen pesa como máximo lo mismo que `surface.jpg` (~8 MB). Para regenerarlas, valida antes la reconstrucción de `Ground` contra `surface.jpg` (lección LL-001, ZEL-002).
- Nunca inventes registros ni coordenadas: si un dato no se puede verificar, déjalo fuera y repórtalo.
