# Lecciones Aprendidas: FUENTES_ZELDA_TOK

**Alcance:** Repositorio

Reglas de este archivo:

- Solo se anexan entradas. Una lección nunca se borra: se marca `OBSOLETA` o `PROMOVIDA`.
- El agente propone lecciones con estado `PROPUESTA`. Solo el desarrollador las cambia a `VIGENTE`.
- Una lección `PROMOVIDA` ya vive en `.harness/rules/`, `.harness/context/` o `contracts/`, y esa fuente manda.
- Si el archivo supera unas 50 lecciones vigentes, el desarrollador lo depura promoviendo o marcando obsoletas.
- No registres secretos, credenciales ni datos personales.

Estados: `PROPUESTA` | `VIGENTE` | `PROMOVIDA` | `OBSOLETA`

---

<!-- Formato de cada lección (copia el bloque y usa el siguiente id libre):

## LL-<NNN> | <YYYY-MM-DD> | Origen: <TASK-ID o SPEC-ID[-fase-N]>
- Estado: PROPUESTA
- Contexto: <en qué situación aplica>
- Lección: <qué hacer o qué evitar, en una o dos líneas>
- Evidencia: <entrada de la bitácora, commit o test que lo demuestra>
- Acción: <Ninguna | Promovida a <ruta>>
-->

## LL-001 | 2026-11-06 | Origen: ATU-001
- Estado: PROPUESTA
- Contexto: Datos nuevos de coleccionables de TotK desde ZeldaMods.
- Lección: Usa la API `https://radar-totk.zeldamods.org/objs/{MainField|MinusField}/` con la conversión `x = -pos[2]`, `y = pos[0]`; verifícala contra un registro conocido antes de generar datos.
- Evidencia: Bitácora ATU-001, entrada DECISIÓN 12:42.
- Acción: Ninguna

## LL-002 | 2026-11-06 | Origen: ATU-001
- Estado: PROPUESTA
- Contexto: Enfocar un marcador desde la lista con Leaflet.markercluster y `removeOutsideVisibleBounds`.
- Lección: `getVisibleParent()` devuelve `null` para marcadores fuera de vista; usa `zoomToShowLayer()` en lugar de `openPopup()` directo.
- Evidencia: Bitácora ATU-001, entrada FALLO 13:20.
- Acción: Ninguna
