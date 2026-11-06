# Quality Gates y Protocolo de Verificación

Este archivo define los criterios mínimos de aceptación técnica. Ninguna tarea se considera finalizada si el agente no ejecuta y aprueba localmente estos gates.

---

## 1. Cadena de Verificación Obligatoria

Antes de notificar al desarrollador que una tarea está completada, el agente DEBE ejecutar, en este orden, los comandos declarados en la sección 4 del `AGENTS.md` del repositorio:

1. **Análisis Estático y Formateo (Linter):**
   - *Criterio de salida:* Código limpio sin warnings de variables no usadas o imports huérfanos.

2. **Tipado Estricto (Typecheck):**
   - *Criterio de salida:* Cero errores. Prohibido suprimir errores con directivas `// @ts-ignore`, `// @ts-nocheck` o `# type: ignore` sin justificación explícita en la spec.

3. **Suite de Pruebas Automatizadas:**
   - Ejecuta las pruebas del módulo alterado y la suite de regresión mínima.
   - *Criterio de salida:* 100% de los tests pasando (`exit code 0`).

---

## 2. Regla de Paridad de Código y Pruebas (Test-Driven Discipline)

- **Todo código nuevo requiere pruebas:** Si la tarea agrega una función de utilidad, servicio o endpoint, es obligatorio incluir su archivo de prueba correspondiente en el mismo ciclo.
- **Prohibido alterar pruebas existentes para forzar su aprobación:** Si un cambio rompe un test preexistente, el agente debe corregir la implementación. Solo se permite actualizar un test si la especificación (spec) declara un cambio intencional en el contrato de salida.

---

## 3. Protocolo en Caso de Bloqueo

Si un comando falla durante la verificación:

1. Analizar el log de error sin modificar archivos de inmediato.
2. Formular una hipótesis puntual de fallo.
3. Aplicar el ajuste mínimo necesario y registrar el intento (`FALLO` o `INTENTO`) con su hipótesis y resultado en la bitácora de `.harness/memory/logs/`.
4. Si la falla persiste tras **dos intentos sucesivos**, ejecutar `rollback.md`, reportar el bloqueo y detenerse.
