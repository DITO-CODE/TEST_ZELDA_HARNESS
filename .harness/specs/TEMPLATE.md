# [TASK-ID]: [Título descriptivo de la tarea]

- **Estado:** DRAFT | APPROVED | IN_PROGRESS | BLOCKED | COMPLETED
- **Responsable:** @desarrollador
- **Rama asignada:** feat/[id]-[slug] | fix/[id]-[slug]
- **Archivos permitidos:** Máximo 5 archivos, incluidos los tests (ver sección de Blast Radius)

---

## 1. Contexto y Problema

[Descripción de 1-2 párrafos del problema técnico o funcional que se busca resolver. Si viene de un issue de Jira/GitHub, enlazar aquí.]

---

## 2. Alcance y Blast Radius (Contención)

El agente tiene autorización EXCLUSIVA para modificar o crear los siguientes archivos:

- [ ] `src/path/to/existing_file.ts` (Modificación)
- [ ] `src/path/to/new_file.ts` (Creación)
- [ ] `tests/path/to/test_file.test.ts` (Tests)

> **REGLA CRÍTICA:** Si la solución requiere tocar un archivo fuera de esta lista, el agente debe DETENERSE y solicitar aprobación antes de continuar.

---

## 3. Criterios de Aceptación Funcionales (Gherkin / Binarios)

Cada criterio debe poder ser validado de forma automática o mediante una prueba puntual:

- [ ] **Escenario 1: Flujo exitoso**
  - *Dado que* el usuario envía un payload válido con los campos requeridos.
  - *Cuando* se invoca el servicio o endpoint `X`.
  - *Entonces* debe retornar código HTTP 200 con el esquema definido en `.harness/context/data-contracts.md`.

- [ ] **Escenario 2: Validación de error**
  - *Dado que* el payload omite el campo obligatorio `Y`.
  - *Cuando* se procesa la petición.
  - *Entonces* debe responder con código HTTP 400 y mensaje de error tipado.

---

## 4. Quality Gates y Comandos de Verificación Local

Comandos exactos que el agente CLI debe ejecutar en terminal antes de reportar la tarea como terminada. Usa los comandos de la sección 4 de `AGENTS.md`:

| Orden | Tipo | Comando | Criterio de Éxito |
| :---: | :--- | :--- | :--- |
| 1 | **Linter** | `[comando]` | 0 warnings, 0 errores |
| 2 | **Typecheck** | `[comando]` | 0 errores |
| 3 | **Unit Test** | `[comando] tests/path/to/test` | 100% pasando |
| 4 | **Coverage** | `[comando]` | Sin regresión de cobertura |

---

## 5. Checklist de Finalización (Autoverificación del Agente)

Antes de reportar la tarea como concluida en terminal, el agente debe marcar estas casillas:

- [ ] Todos los criterios de la Sección 3 fueron implementados.
- [ ] Los comandos de la Sección 4 retornaron código de salida `0`.
- [ ] No se modificaron archivos fuera de la lista de Blast Radius.
- [ ] No se introdujeron credenciales, secretos ni dependencias no autorizadas.
- [ ] Se ejecutó el commit siguiendo Conventional Commits (según `.harness/rules/git-workflow.md`).
