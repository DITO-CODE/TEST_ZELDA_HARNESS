# Flujo de Git y Contención de Cambios

---

## 1. Políticas de Ramas

- **Prohibido operar en ramas protegidas:** el agente jamás ejecuta cambios sobre `main`, `master`, `staging` o `develop`.
- **Nomenclatura obligatoria:** la rama lleva la clave de Jira de la spec.
  - `feat/<TASK-ID>-<descripcion-corta>`
  - `fix/<TASK-ID>-<descripcion-corta>`
  - `refactor/<TASK-ID>-<descripcion-corta>`
- **Verificación inicial:** antes de modificar cualquier archivo, ejecuta `git branch --show-current` y confirma que es la rama asignada en `spec.md`.

---

## 2. Límites de Contención (Blast Radius)

- **Límite de archivos:** máximo **5 archivos** por spec en el arnés declarativo y por fase en el federado, incluidos los tests. La lista autorizada es la tabla Blast Radius de `tasks.md`.
- **No cuentan:** archivos de lock, archivos generados, `.harness/memory/`, `.harness/specs/`, `.harness/contracts/`, `.harness/runs/` y `graphify-out/`.
- Si la solución requiere más archivos, el agente pausa y pide al desarrollador dividir la tarea en sub-specs.
- **Límite de líneas:** evita diffs de más de 300 líneas modificadas (sin contar archivos de lock).

---

## 3. Convención de Commits

Los commits son atómicos y siguen *Conventional Commits*:

- Formato: `<tipo>(<alcance>): <descripción concisa>`
- Ejemplos:
  - `feat(auth): add jwt validation middleware`
  - `fix(checkout): resolve price rounding in cart summary`
  - `test(users): add unit tests for user creation service`
- Prohibido añadir explicaciones extensas generadas por IA en el título.

Commits separados, nunca mezclados con código:

| Qué | Mensaje | ¿Requiere gates? |
| :--- | :--- | :--- |
| Artefactos de la spec y cambios de contrato, antes de aprobar | `docs(spec): <TASK-ID> <resumen>` | No |
| Bitácora, lecciones y avance `[x]` de `tasks.md` | `chore(memory): <TASK-ID> <resumen>` | No |

`.harness/runs/` y `graphify-out/` están en `.gitignore` y nunca se commitean.

---

## 4. Rollback

La única política válida para revertir cambios es `rollback.md`.
