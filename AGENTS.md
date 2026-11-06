# AGENTS.md - Protocolo de Ejecución de Agentes de Desarrollo

Este repositorio opera bajo **Spec-Driven Development (SDD)**. Todo agente de terminal (Claude Code, Gemini CLI, Antigravity, Cursor, etc.) debe seguir este protocolo.

---

## 0. Jerarquía de Autoridad

Ante cualquier conflicto manda el nivel superior. Este archivo siempre está en la cima.

| Nivel | Fuente |
| :-: | :--- |
| 1 | `AGENTS.md` (este archivo) |
| 2 | `.harness/rules/*.md` |
| 3 | Contratos OpenAPI en `.harness/contracts/` y sus `fixtures/` |
| 4 | `.harness/context/` |
| 5 | `constitution.md` de la spec |
| 6 | `spec.md` → `plan.md` → `tasks.md` de la spec |
| 7 | Skills de agentes y código existente |

---

## 1. Reglas Cardinales

1. **Sin spec ejecutable no hay código:** solo puedes modificar el repositorio si la tarea tiene su carpeta `.harness/specs/<TASK-ID>/` con `spec.md` en estado `APPROVED` o `IN_PROGRESS` y un `tasks.md`.
2. **Blast Radius:** solo puedes modificar o crear los archivos de la tabla Blast Radius de `tasks.md`, con un máximo de **5 archivos por spec**, incluidos los tests. No cuentan los archivos de lock, los generados, `.harness/memory/`, `.harness/specs/`, `.harness/contracts/`, `.harness/runs/` ni `graphify-out/`. Si necesitas otro archivo, detente y pide aprobación.
3. **Verification First:** una tarea solo está completa cuando todos los comandos de la sección 5 terminan con código de salida `0`.
4. **Contratos inmutables durante la ejecución:** con la spec en `APPROVED` o `IN_PROGRESS`, `.harness/contracts/` es de solo lectura. Si un contrato debe cambiar, detente y pide pasar la spec a `BLOCKED`.
5. **Sin refactor no solicitado:** no arregles code smells, no reorganices imports ni actualices librerías ajenas a la spec.
6. **Sin commits de código roto:** solo haz commit después de pasar los gates.

---

## 2. Protocolo de Arranque

Antes de modificar cualquier archivo:

1. **Carga las reglas obligatorias:**
   - `.harness/rules/security.md`
   - `.harness/rules/git-workflow.md`
   - `.harness/rules/testing-gates.md`
   - `.harness/rules/rollback.md`
2. **Identifica la spec:** usa el `TASK-ID` indicado por el desarrollador. Si no indicó ninguno, tómalo de la rama actual (`feat/AUTH-102-login` → `AUTH-102`).
3. **Valida la spec:** comprueba que exista `.harness/specs/<TASK-ID>/spec.md` con estado `APPROVED` o `IN_PROGRESS` y que exista `tasks.md`. Con cualquier otro estado, detente.
4. **Valida la rama:** ejecuta `git branch --show-current`. Debe coincidir con la rama asignada en `spec.md` y no ser una rama protegida.
5. **Valida el repositorio:** ejecuta `git status --short`. Si la salida no está vacía, detente y consulta al desarrollador. No guardes, reviertas ni borres cambios que no sean tuyos.
6. **Carga la memoria y la constitución:** lee `.harness/memory/lessons-learned.md` y `.harness/specs/<TASK-ID>/constitution.md` si existe. Si la spec está en `IN_PROGRESS`, lee también `.harness/memory/logs/<TASK-ID>.md` y retoma desde su última entrada.
7. **Confirma en consola:**

   ```text
   [ARRANQUE OK] Spec: <TASK-ID> | Estado: <estado> | Rama: <rama> | Reglas cargadas: 4 | Lecciones: <n vigentes> | Bitácora: <nueva o n entradas> | Agentes: <versión o NO INSTALADO>
   ```

Si no puedes completar un paso, detente con el reporte de paro de la sección 8.

---

## 3. Skills de Agentes de Desarrollo

Las specs se crean y se ejecutan con el paquete `agentes-desarrollo` (SpecFlow + `multi-model-orchestrator`). Sus skills están en el nivel 7: aplican sus procesos, pero nunca por encima de este archivo ni de `.harness/rules/`.

- **Crear una spec:** `specflow-specify` → `specflow-clarify` → `specflow-constitution` → `specflow-plan` → `specflow-tasks`. La spec queda en `DRAFT` hasta que el desarrollador la aprueba.
- **Ejecutar una spec:** `specflow-implement`, que entrega `tasks.md` al `multi-model-orchestrator`.
- **Si el paquete no está instalado** (en `.claude/skills/`, `.agents/skills/` o en las carpetas globales equivalentes): detente con `Origen: HARNESS`, `Regla: AGENTS.md §3`, y pide instalarlo (`agentes-desarrollo/install.sh --project .`). No crees specs ni código sin él.
- La estructura de la carpeta de una spec está en `.harness/specs/README.md`.

---

## 4. Contexto Bajo Demanda

- Antes de crear o modificar endpoints, payloads, esquemas o modelos, lee `.harness/context/data-contracts.md` y el contrato de `.harness/contracts/` que corresponda.
- Antes de crear archivos, mover código o cruzar módulos, lee `.harness/context/system-overview.md`. Si existe `graphify-out/GRAPH_REPORT.md`, consúltalo antes de buscar en los archivos.
- No cargues documentación que no corresponda al dominio de la tarea.

### 4.1 Navegación con el grafo (graphify)

`graphify-out/` (raíz del repo) contiene el grafo de conocimiento de `proyecto/`. Es generado, está en `.gitignore` y no cuenta para el Blast Radius.

- **Primero el grafo, después el código:** para preguntas de impacto ("¿qué llama a X?", "¿qué toca este ID del DOM?") lee `graphify-out/GRAPH_REPORT.md` o consulta el grafo, y abre solo los archivos que señale.
- **Las aristas `INFERRED` y `AMBIGUOUS` no son hechos:** verifícalas en el código antes de decidir con ellas. Solo las `EXTRACTED` vienen del AST.
- **Ignora el ruido de terceros:** las funciones minificadas de `jquery.min.js`, `leaflet.js` y `leaflet.markercluster.js` no son dominio y no se modifican.
- **Mantén el grafo vigente:** regenerarlo (`/graphify proyecto --update`) consume cuota; pídelo al desarrollador al cerrar una spec que cambió `proyecto/` (ver `.harness/rules/security.md`).

---

## 5. Comandos Canónicos de Verificación

El stack es HTML/CSS/JavaScript ES5 estático, con librerías vendorizadas y sin `package.json` ni paso de build. Los gates usan solo **Node.js (≥ 18)**, sin instalar dependencias ni acceder a la red. Ejecútalos desde la **raíz del repositorio**.

| Ámbito | Linter | Tipado | Tests |
| :--- | :--- | :--- | :--- |
| **Frontend (`proyecto/`)** | Sintaxis JS (5.1) | Contrato de datos (5.2) | Integridad offline (5.3) |

**5.1 Linter: sintaxis de los scripts propios** (no incluye las librerías de terceros):

```bash
node --check proyecto/js/app.js && node --check proyecto/data/wells.js && node --check proyecto/data/outfits.js
```

**5.2 Tipado: contrato de datos de `.harness/context/data-contracts.md`.** Comprueba, para `wells.*` y `outfits.*`, que el `.json` y el `.js` sean idénticos, que no haya campos de más, que los `id` sean únicos, los tipos, los enumerados de atuendos y que las coordenadas estén dentro de `MAP_BOUNDS`:

```bash
node -e "const fs=require('fs'),vm=require('vm');const ck=(n,g,keys,extra)=>{const j=JSON.parse(fs.readFileSync('proyecto/data/'+n+'.json','utf8'));const c={window:{}};vm.runInNewContext(fs.readFileSync('proyecto/data/'+n+'.js','utf8'),c);if(JSON.stringify(j)!==JSON.stringify(c.window[g]))throw new Error(n+'.json y '+n+'.js difieren');const ids=new Set();for(const r of j){if(Object.keys(r).sort().join()!==keys)throw new Error(n+' campos '+r.id);if(!/^\d{4}[A-Z]?$/.test(r.id)||ids.has(r.id))throw new Error(n+' id '+r.id);ids.add(r.id);if(typeof r.name!=='string'||![r.x,r.y,r.z].every(Number.isFinite))throw new Error(n+' tipos '+r.id);if(Math.abs(r.x)>5000||Math.abs(r.y)>6000)throw new Error(n+' fuera de MAP_BOUNDS '+r.id);if(extra)extra(r)}return j.length};const w=ck('wells','TOTK_WELLS','id,name,x,y,z');const o=ck('outfits','TOTK_OUTFITS','id,layer,name,set,slot,x,y,z',r=>{if(typeof r.set!=='string'||!['head','body','legs'].includes(r.slot)||!['surface','sky','depths'].includes(r.layer))throw new Error('outfits enum '+r.id)});console.log('CONTRATO_OK wells='+w+' outfits='+o)"
```

**5.3 Tests: integridad offline de `proyecto/index.html`.** Comprueba que todo `src`/`href` local exista y que no se cargue nada por CDN (invariante 1 de `system-overview.md`):

```bash
node -e "const fs=require('fs'),p=require('path');const h=fs.readFileSync('proyecto/index.html','utf8');const refs=[...h.matchAll(/(?:src|href)=\"([^\"#]+)\"/g)].map(m=>m[1]).filter(r=>!r.startsWith('data:'));const bad=refs.filter(r=>/^(https?:)?\/\//.test(r)||!fs.existsSync(p.join('proyecto',r)));if(bad.length)throw new Error('refs invalidas: '+bad.join(', '));console.log('REFS_OK',refs.length)"
```

Ejecuta los comandos del ámbito modificado en este orden: linter, tipado y tests. Si un comando no existe o está en `[DEFINIR]`, detente y repórtalo. No lo sustituyas por otro.

- **Una spec que agregue una categoría de datos** (por ejemplo, `shrines.*`) debe extender 5.1 y 5.2 con sus archivos y su contrato, dentro de su Blast Radius.
- **No hay tests de UI automatizados.** Si la spec cambia `index.html`, `app.js` o `styles.css`, además de los gates abre `proyecto/index.html` con `file://` y verifica a mano los flujos afectados (sección 5 de `system-overview.md`). Registra el resultado en la bitácora.

---

## 6. Estado de la Spec

Solo el desarrollador cambia el estado de la spec. El agente puede editarlo únicamente si el desarrollador se lo pide.

Estados válidos: `DRAFT`, `APPROVED`, `IN_PROGRESS`, `BLOCKED` y `COMPLETED`.

---

## 7. Memoria y Registros

Hay dos registros distintos:

| | Bitácora de la spec | Log de ejecución |
| :--- | :--- | :--- |
| Ruta | `.harness/memory/logs/<TASK-ID>.md` | `.harness/runs/<TASK-ID>/<fecha-hora>/` |
| Qué guarda | Decisiones, intentos, fallos, paros, rollbacks, cierre | Cada paso del orquestador: router, workers, modelos, auditor, tiempos y dashboard |
| Git | Versionada | Ignorado (`.gitignore`), solo consulta local |

1. **Bitácora:** al iniciar una spec, crea `.harness/memory/logs/<TASK-ID>.md` a partir de `.harness/memory/logs/TEMPLATE.md`. Registra cada decisión no trivial, intento, fallo de gate, paro, rollback y bloqueo. Solo anexa entradas.
2. **Lecciones aprendidas:** antes de solicitar el paso a `COMPLETED`, revisa la bitácora y propón en `.harness/memory/lessons-learned.md` las lecciones reutilizables con estado `PROPUESTA`. El desarrollador las cambia a `VIGENTE` o las descarta.
3. **Promoción:** si una lección debe cumplirse siempre, el desarrollador la mueve a `.harness/rules/`, `.harness/context/` o un contrato y la marca `PROMOVIDA`.
4. **Commits:** la memoria y el avance `[x]` de `tasks.md` van en su propio commit `chore(memory): <TASK-ID> <resumen>`.
5. **Seguridad:** no registres secretos, credenciales ni datos personales en ninguno de los dos registros.

---

## 8. Fallos, Intentos y Paros

1. **Intentos:** un gate fallido permite 2 intentos automáticos. Después el agente pregunta si intentar de nuevo (1 intento más), ejecutar el rollback o detenerse. Máximo 3. El detalle está en `.harness/rules/testing-gates.md` §3.
2. **Rollback:** `.harness/rules/rollback.md` es la única fuente de verdad para revertir cambios.
3. **Reporte de paro:** todo paro imprime este formato. `Origen: HARNESS` si lo provoca una regla del harness (`AGENTS.md`, reglas, contratos, contexto o la constitución de la spec); `Origen: AGENTES` si lo decide una skill de agentes (divergencia del plan, HITL, auditor no disponible).

   ```text
   [EJECUCIÓN DETENIDA]
   Origen: HARNESS | AGENTES
   Regla: <archivo y sección>
   Spec: <TASK-ID> | Fase: N/A | Tarea: <TNNN o N/A>
   Motivo: <una o dos líneas>
   Intentos: <n de 3 o N/A>
   Estado sugerido de la spec: BLOCKED | Sin cambio
   Log de ejecución: <ruta de .harness/runs/... o N/A>
   Siguiente acción: <qué debe decidir el desarrollador>
   ```

4. Registra cada paro en la bitácora como entrada `PARO`.
