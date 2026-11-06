# Contratos de Datos e Invariantes de Negocio

<!-- AJUSTAR: generado a partir del código actual (2026-11-06). Revisa y completa las convenciones. -->

## 1. Modelo de Pozo (`data/wells.json` y `window.TOTK_WELLS`)

Arreglo de objetos con este esquema exacto:

```json
{
  "id": "0001",
  "name": "Dronoc's Pass Well",
  "x": 2105.445,
  "y": -3831.584,
  "z": 125.203
}
```

| Campo | Tipo | Regla |
| :--- | :--- | :--- |
| `id` | string | 4 dígitos con ceros a la izquierda, único. La app ordena por `id`. |
| `name` | string | Nombre del pozo; se escapa con `escapeHtml()` al renderizar. |
| `x` | number | Coordenada usada como **lat** en Leaflet (`L.marker([x, y])`). En la UI se muestra como "Y". |
| `y` | number | Coordenada usada como **lng** en Leaflet. En la UI se muestra como "X". |
| `z` | number | Altura; solo se muestra en el popup. |

- Las coordenadas deben estar dentro de `MAP_BOUNDS = [[-5000, -6000], [5000, 6000]]`.
- No agregar campos sin actualizar este contrato.

---

## 2. Persistencia en `localStorage`

| Clave | Contenido | Validación al leer |
| :--- | :--- | :--- |
| `totk.wells.found.v1` | Arreglo JSON de `id` encontrados | Se descartan ids que no existan en los datos |
| `totk.wells.view.v1` | `{ "lat": number, "lng": number, "zoom": number }` | Números finitos, zoom en `[-4, 1]` y centro dentro de `MAP_BOUNDS` |

- Si cambia el formato de un valor, crea una clave nueva con sufijo de versión (`.v2`) y migra desde la anterior; no rompas el progreso guardado de los usuarios.

---

## 3. Nomenclatura

- Variables y funciones JS: `camelCase`. Constantes: `UPPER_SNAKE_CASE`.
- Clases CSS: BEM (`bloque__elemento--modificador`) y estados con `is-*`.
- Atributos de acción en el DOM: `data-*` (`data-focus-well`, `data-toggle-well`, `data-center-well`).
