# Checklist de calidad de la spec: ZEL-002 Mapas del cielo y de las profundidades con navegación entre capas

**Propósito:** validar que la spec está completa antes de planear
**Creada:** 2026-11-06
**Spec:** spec.md

## Calidad del contenido
- [x] Sin detalles de implementación (lenguajes, frameworks, APIs, archivos)
- [x] Enfocada en el valor para el usuario y el negocio
- [x] Comprensible para personas no técnicas
- [x] Secciones obligatorias completas

## Requisitos
- [x] No quedan marcas [NECESITA ACLARACIÓN]
- [x] Requisitos verificables y sin ambigüedad
- [x] Criterios de éxito medibles y agnósticos de tecnología
- [x] Escenarios de aceptación definidos
- [x] Casos límite identificados
- [x] Alcance acotado (dentro y fuera)
- [x] Dependencias y supuestos identificados

## Harness
- [x] Encabezado completo (TASK-ID, Estado DRAFT, Rama, Ámbito)
- [x] No contradice AGENTS.md, rules ni contratos vigentes

## Notas
- Los puntos incompletos se corrigen antes de specflow-clarify o specflow-plan.
- Riesgo para el plan: el Blast Radius probablemente supere 5 archivos (lógica, marcado, estilos y dos imágenes). Las imágenes son activos, no código, pero el plan debe decidir si cuentan o si se divide en sub-specs.
- Las imágenes se descargan durante la implementación y requieren consentimiento (`.harness/rules/security.md`).
- Los nombres de campos (`surface`, `sky`, `depths`) en "Dependencias" son referencias a los datos existentes, no decisiones de implementación.
