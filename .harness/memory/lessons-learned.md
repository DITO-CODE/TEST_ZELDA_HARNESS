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
