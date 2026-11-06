# Bitácora: <TASK-ID o SPEC-ID[-fase-N]>

- **Spec:** <ruta de la carpeta de la spec>
- **Repositorio:** FUENTES_ZELDA_TOK
- **Rama:** <rama>
- **Fase:** <número o N/A>

Reglas de este archivo:

- Se crea al iniciar la spec o la fase copiando esta plantilla a `<TASK-ID>.md`, `SPEC-<ID>.md` (Núcleo) o `SPEC-<ID>-fase-<N>.md` (satélite).
- Solo se anexan entradas, en orden cronológico. No se editan ni se borran entradas anteriores.
- Se registra lo que no queda en el diff: decisiones, hipótesis, intentos fallidos y causas raíz.
- Esta bitácora es del harness y se versiona. El detalle de cada paso del orquestador (modelos, workers, tiempos) va en el log de ejecución de `.harness/runs/`, que no se versiona.
- No registres secretos, credenciales ni datos personales.

Tipos de entrada:

- Todos: `DECISIÓN`, `INTENTO`, `FALLO`, `PARO`, `ROLLBACK`, `BLOQUEO`, `CIERRE`.
- `PARO` registra cada `[EJECUCIÓN DETENIDA]` con su `Origen` (`HARNESS` o `AGENTES`) y la regla aplicada.
- Solo bitácora consolidada del Núcleo: `ESTADO` (cambio de estado de la spec), `CONTRATO` (versión de contrato), `RESUMEN_FASE`.

---

<!-- Formato de cada entrada:

## <YYYY-MM-DD HH:MM> | <TIPO>
- Qué: <descripción breve>
- Por qué: <motivo o regla/contexto que lo justifica>
- Archivos: <rutas o N/A>
- Origen: <solo en PARO: HARNESS | AGENTES, y la regla>
- Autorizado por: <solo en el tercer INTENTO: @desarrollador>
- Resultado: <resultado, intento N de 3, causa raíz o stash>
-->
