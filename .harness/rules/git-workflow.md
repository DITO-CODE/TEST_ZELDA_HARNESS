# Flujo de Git y Contención de Cambios

---

## 1. Políticas de Ramas (Branching)

- **Prohibido operar en ramas protegidas:** El agente jamás debe ejecutar cambios directamente sobre `main`, `master`, `staging` o `develop`.
- **Nomenclatura obligatoria de ramas:**
  - `feat/<task-id>-<descripcion-corta>`
  - `fix/<task-id>-<descripcion-corta>`
  - `refactor/<task-id>-<descripcion-corta>`
- **Verificación inicial:** Antes de modificar cualquier archivo, el agente debe ejecutar `git branch --show-current` para cerciorarse de que se encuentra en la rama de la tarea.

---

## 2. Límites de Contención (Blast Radius)

- **Límite de archivos:** Máximo **5 archivos** autorizados por spec en el arnés declarativo y por fase en el federado, incluidos los tests. Los archivos de lock, los generados y los de `.harness/memory/` no cuentan. Si la solución requiere más, el agente debe pausar y solicitar al desarrollador dividir la tarea en sub-specs.
- **Límite de líneas:** Evitar diffs que superen las 300 líneas modificadas (excluyendo archivos de lock como `package-lock.json`).

---

## 3. Convención de Commits

Los commits generados por el agente deben ser atómicos y seguir estrictamente *Conventional Commits*:

- Formato: `<tipo>(<alcance>): <descripción concisa>`
- Ejemplos válidos:
  - `feat(auth): add jwt validation middleware`
  - `fix(checkout): resolve price rounding in cart summary`
  - `test(users): add unit tests for user creation service`
- Queda prohibido añadir explicaciones extensas generadas por IA dentro del título del commit.
- **Memoria en commits separados:** Los cambios en `.harness/memory/` nunca se mezclan con código. Van en su propio commit `chore(memory): <TASK-ID> <resumen>`, que no requiere pasar los gates.

---

## 4. Rollback

La única política válida para revertir cambios es `rollback.md`.
