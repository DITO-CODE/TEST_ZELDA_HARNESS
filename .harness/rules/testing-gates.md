# Quality Gates y Protocolo de Verificación

Este archivo define los criterios mínimos de aceptación técnica. Ninguna tarea se considera terminada si el agente no ejecuta y aprueba localmente estos gates.

---

## 1. Cadena de Verificación Obligatoria

Antes de notificar al desarrollador que una tarea está completa, el agente DEBE ejecutar, en este orden, los comandos de la sección de Comandos Canónicos del `AGENTS.md` del repositorio, para el ámbito modificado:

1. **Análisis estático y formateo (linter):** sin warnings de variables no usadas ni imports huérfanos.
2. **Tipado estricto (typecheck / compilación):** cero errores. Prohibido suprimir errores con `// @ts-ignore`, `// @ts-nocheck`, `# type: ignore`, `@SuppressWarnings` o equivalentes sin justificación explícita en la spec.
3. **Pruebas automatizadas:** las del módulo alterado y la suite de regresión mínima, con 100% pasando (`exit code 0`).

Si un comando no existe o está como `[DEFINIR]`, detente y repórtalo. No lo sustituyas por otro sin confirmación del desarrollador.

---

## 2. Regla de Paridad de Código y Pruebas

- **Todo código nuevo requiere pruebas:** si la tarea agrega una función, servicio, endpoint o componente, su prueba va en el mismo ciclo.
- **Prohibido alterar pruebas existentes para forzar su aprobación:** si un cambio rompe un test, se corrige la implementación. Solo se actualiza un test si la spec declara un cambio intencional en el contrato de salida.
- **Pruebas desconectadas:** los tests no dependen de servidores vivos, bases de datos reales ni red. Los mocks reflejan los `fixtures/` del contrato OpenAPI.

---

## 3. Política de Intentos

Si un gate falla:

1. Analiza el log de error sin modificar archivos de inmediato.
2. Formula una hipótesis puntual de fallo.
3. Aplica el ajuste mínimo y registra el intento (`INTENTO` o `FALLO`) con su hipótesis y resultado en la bitácora de `.harness/memory/logs/`.
4. Hay **2 intentos automáticos**. Si los dos fallan, **detente y pregunta** con el reporte de paro (`Origen: HARNESS`, `Regla: rules/testing-gates.md §3`) y estas opciones:
   1. Intentar de nuevo: **1 intento adicional**.
   2. Ejecutar `rollback.md`.
   3. Detenerse sin tocar nada para que el desarrollador revise.
5. Si el intento adicional falla, ofrece solo las opciones 2 y 3. **Máximo 3 intentos por gate.**
6. Si nadie responde, aplica la opción 3. El agente nunca ejecuta el rollback por esta causa sin respuesta.
7. Registra el tercer intento como `INTENTO` con `Autorizado por: <desarrollador>`.
