# Lecciones Aprendidas: FUENTES_ZELDA_TOK

**Alcance:** Repositorio

Reglas de este archivo:

- Solo se anexan entradas. Una lección nunca se borra: se marca `OBSOLETA` o `PROMOVIDA`.
- El agente propone lecciones con estado `PROPUESTA`. Solo el desarrollador las cambia a `VIGENTE`.
- Una lección `PROMOVIDA` ya vive en `.harness/rules/`, `.harness/context/`, un contrato o `AGENTS.md`, y esa fuente manda.
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

## LL-001 | 2026-11-06 | Origen: ZEL-002
- Estado: PROPUESTA
- Contexto: Imágenes de mapa de TotK para cualquier capa.
- Lección: Las teselas `https://objmap-totk.zeldamods.org/game_files/map/{Sky|Ground|Depths}/maptex/5/{x}/{y}.webp` (24 x 20) unidas y recortadas a 6000 x 5000 coinciden con `MAP_BOUNDS`. Valida siempre contra `surface.jpg` (MAE < 12) antes de usar una capa nueva.
- Evidencia: Bitácora ZEL-002, DECISIÓN 16:50 (MAE 0,89/255).
- Acción: Ninguna

## LL-002 | 2026-11-06 | Origen: ZEL-002
- Estado: PROPUESTA
- Contexto: Atajos de teclado con flechas sobre un mapa de Leaflet.
- Lección: Registra el `keydown` en fase de captura en `document` y llama a `stopPropagation()` para que Leaflet no desplace el mapa; no edites la librería ni desactives `keyboard`.
- Evidencia: Bitácora ZEL-002, verificación US1 (pulsación real ↑ sin mover el panel).
- Acción: Ninguna

## LL-003 | 2026-11-06 | Origen: ZEL-002
- Estado: PROPUESTA
- Contexto: Animaciones con la regla global `prefers-reduced-motion` de styles.css (`animation-duration: 0.01ms !important`).
- Lección: Para una variante reducida que debe verse (fundido), sobrescríbela con un selector más específico y `!important` dentro del mismo `@media`, y controla el flujo con temporizadores, no con `animationend`.
- Evidencia: Bitácora ZEL-002, DECISIÓN 17:55.
- Acción: Ninguna

## LL-004 | 2026-11-06 | Origen: ZEL-002
- Estado: PROPUESTA
- Contexto: Estimar el Blast Radius y el diff de specs de UI con animación.
- Lección: Una funcionalidad de UI más su animación supera con facilidad las 300 líneas; separa la animación en una spec propia cuando el plan estime más de 250 líneas.
- Evidencia: Bitácora ZEL-002, CIERRE (436 + 48 líneas).
- Acción: Ninguna
