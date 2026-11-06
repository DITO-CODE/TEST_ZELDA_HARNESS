# Bitácora: <TASK-ID o SPEC-ID[-fase-N]>

- **Spec:** <ruta de la spec>
- **Repositorio:** FUENTES_ZELDA_TOK
- **Rama:** <rama>
- **Fase:** <número o N/A>

Reglas de este archivo:

- Se crea al iniciar la spec o la fase copiando esta plantilla a `<TASK-ID>.md`, `SPEC-<ID>.md` (Núcleo) o `SPEC-<ID>-fase-<N>.md` (satélite).
- Solo se anexan entradas, en orden cronológico. No se editan ni se borran entradas anteriores.
- Se registra lo que no queda en el diff: decisiones, hipótesis, intentos fallidos y causas raíz.
- No registres secretos, credenciales ni datos personales.

Tipos de entrada:

- Todos: `DECISIÓN`, `INTENTO`, `FALLO`, `ROLLBACK`, `BLOQUEO`, `CIERRE`.
- Solo bitácora consolidada del Núcleo: `ESTADO` (cambio de estado de la spec), `CONTRATO` (versión de contrato), `RESUMEN_FASE`.

---

<!-- Formato de cada entrada:

## <YYYY-MM-DD HH:MM> | <TIPO>
- Qué: <descripción breve>
- Por qué: <motivo o regla/contexto que lo justifica>
- Archivos: <rutas o N/A>
- Resultado: <resultado, intento N de 2, causa raíz o stash>
-->
