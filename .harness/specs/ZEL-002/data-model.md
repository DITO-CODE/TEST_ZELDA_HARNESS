# Modelo de datos: ZEL-002 Mapas del cielo y de las profundidades

## Entidades

### Capa de mapa (`LAYERS`)

- **Descripción:** cada una de las tres capas visibles. Es una lista ordenada de arriba abajo, declarada en un solo lugar (constitución I).
- **Dueño del dato:** `proyecto/js/app.js` (constante). Las imágenes viven en `proyecto/assets/img/`.
- **Campos:**

  | Campo | Tipo | Obligatorio | Reglas |
  | :--- | :--- | :--- | :--- |
  | `key` | string | sí | `sky` \| `surface` \| `depths`; igual al valor de `layer` de los datos |
  | `label` | string | sí | `Cielo` \| `Superficie` \| `Profundidades` |
  | `image` | string | sí | Ruta local relativa: `assets/img/sky.jpg`, `assets/img/surface.jpg`, `assets/img/depths.jpg` |
  | `overlay` | `L.ImageOverlay` \| null | no | Se crea al primer uso (R8) |
  | `failed` | boolean | no | `true` si la imagen disparó `error` |

- **Orden:** índice 0 = `sky`, 1 = `surface`, 2 = `depths`. ↑ resta 1 y ↓ suma 1, con límites en 0 y 2 (RF-003, RF-005).
- **Transiciones de estado:**

  | Desde | Evento | Hacia |
  | :--- | :--- | :--- |
  | `surface` | ↑ / botón subir | `sky` (animación de ascenso) |
  | `surface` | ↓ / botón bajar | `depths` (animación de descenso) |
  | `sky` | ↓ / botón bajar | `surface` (descenso) |
  | `depths` | ↑ / botón subir | `surface` (ascenso) |
  | `sky` | ↑ | `sky` (señal de límite) |
  | `depths` | ↓ | `depths` (señal de límite) |
  | cualquiera | arranque con clave guardada válida | capa guardada, sin animación |

### Coleccionable (sin cambios de esquema)

- **Descripción:** registros de `data/wells.*` y `data/outfits.*`, según `.harness/context/data-contracts.md` §2.
- **Capa efectiva:** `item.layer` si existe; si no, `"surface"`. Los pozos no tienen `layer` y son de superficie (RF-013).
- **Conteo esperado por capa:** atuendos 7 / 48 / 30, pozos 0 / 58 / 0. Se calcula en tiempo de ejecución y nunca se escribe a mano (constitución I).

### Preferencia: última capa vista (nueva)

| Clave `localStorage` | Tipo | Reglas |
| :--- | :--- | :--- |
| `totk.map.layer.v1` | string JSON | `"sky"` \| `"surface"` \| `"depths"`. Cualquier otro valor, error de lectura o ausencia da `surface` (RF-015, caso límite de capa corrupta). Se lee y escribe dentro de `try/catch` (invariante 3). |

Las claves `totk.wells.found.v1`, `totk.outfits.found.v1` y `totk.wells.view.v1` no cambian (constitución IV, CE-004).

## Reglas de validación

- Los contadores, la lista, la búsqueda y los filtros consideran solo los elementos de la capa visible (RF-011).
- El total que se muestra es el de la capa visible; con 0 elementos se muestra el estado vacío con el texto "No hay <plural> en <capa>" (RF-012).
- `toggleWell` sigue guardando en la clave de la categoría sin importar la capa (RF-014).
- `resetProgress` vacía toda la categoría (las tres capas) y el diálogo lo explica (RF-017).

## Origen

- Requisitos: RF-001 a RF-017.
- Aclaraciones: sesión de `specflow-specify`, 2026-11-06 (TASK-ID, origen de las imágenes, estilo de animación).
