# Specs del harness

Cada spec vive en su propia carpeta, nombrada con la clave de Jira, y se genera con las skills de SpecFlow del paquete `agentes-desarrollo`:

```text
.harness/specs/<TASK-ID>/
├── spec.md                    specflow-specify  · QUÉ y POR QUÉ; encabezado con Estado, Rama y Ámbito
├── checklists/requirements.md specflow-specify  · calidad de la spec
├── constitution.md            specflow-constitution · principios solo de esta spec
├── plan.md                    specflow-plan     · CÓMO, verificación de jerarquía, cambios a contratos
├── research.md                specflow-plan
├── data-model.md              specflow-plan
├── quickstart.md              specflow-plan
└── tasks.md                   specflow-tasks    · tareas por etapa y tabla Blast Radius
```

## Flujo

1. `specflow-specify` → `specflow-clarify` → `specflow-constitution` → `specflow-plan` → `specflow-tasks`.
2. El desarrollador revisa la carpeta completa y cambia el estado en `spec.md` a `APPROVED`.
3. `specflow-implement` ejecuta el arranque y entrega `tasks.md` al `multi-model-orchestrator`.

## Reglas

- La clave de la carpeta es la misma de la rama (`feat/<TASK-ID>-<slug>`).
- Solo el desarrollador cambia el estado de la spec.
- Después de `APPROVED`, ni la spec ni los contratos que modifica se editan sin regresar a `DRAFT` (o `BLOCKED_REVIEW` en Federado).
- La jerarquía de autoridad está en `AGENTS.md` §0. La constitución de la spec nunca puede contradecir los niveles superiores.
