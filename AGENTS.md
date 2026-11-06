# AGENTS.md - Protocolo de Ejecución de Agentes de Desarrollo

Este repositorio opera bajo **Spec-Driven Development (SDD)**. Todo agente de terminal (Claude Code, Gemini CLI, Cursor, etc.) debe seguir este protocolo.

---

## 1. Reglas Cardinales

1. **Sin spec ejecutable no hay código:** Solo puedes modificar el repositorio si la tarea tiene una spec en `.harness/specs/<TASK-ID>.md` con estado `APPROVED` o `IN_PROGRESS`.
2. **Blast Radius:** Solo puedes modificar o crear los archivos listados en la spec, con un máximo de **5 archivos por spec**, incluidos los tests. Los archivos de lock, los generados y los de `.harness/memory/` no cuentan. Si necesitas más archivos o uno fuera de la lista, detente y pide aprobación.
3. **Verification First:** Una tarea solo está completa cuando todos los comandos de la sección 4 terminan con código de salida `0`.
4. **Sin refactor no solicitado:** No arregles code smells, no reorganices imports ni actualices librerías ajenas a la spec.
5. **Sin commits de código roto:** Solo haz commit después de pasar los gates.

---

## 2. Protocolo de Arranque

Antes de modificar cualquier archivo:

1. **Carga las reglas obligatorias:**
   - `.harness/rules/security.md`
   - `.harness/rules/git-workflow.md`
   - `.harness/rules/testing-gates.md`
   - `.harness/rules/rollback.md`
2. **Identifica la spec:** Usa la indicada por el desarrollador. Si no indicó ninguna, obtén el `TASK-ID` del nombre de la rama actual.
3. **Valida la spec:** Comprueba que el archivo exista y que su estado sea `APPROVED` o `IN_PROGRESS`. Con cualquier otro estado, detente.
4. **Valida la rama:** Ejecuta `git branch --show-current`. Debe coincidir con la rama asignada en la spec y no ser una rama protegida.
5. **Valida el repositorio:** Ejecuta `git status --short`. Si la salida no está vacía, detente y consulta al desarrollador. No guardes, reviertas ni borres cambios que no sean tuyos.
6. **Carga la memoria:** Lee `.harness/memory/lessons-learned.md`. Si la spec está en `IN_PROGRESS`, lee también `.harness/memory/logs/<TASK-ID>.md` y retoma desde su última entrada.
7. **Confirma en consola:**

   ```text
   [ARRANQUE OK] Spec: <TASK-ID> | Estado: <estado> | Rama: <rama> | Reglas cargadas: 4 | Lecciones: <n vigentes> | Bitácora: <nueva o n entradas>
   ```

Si no puedes completar un paso, detente e informa qué falló.

---

## 3. Contexto Bajo Demanda

- Antes de crear o modificar endpoints, payloads, esquemas o modelos, lee `.harness/context/data-contracts.md`.
- Antes de crear archivos, mover código o cruzar módulos, lee `.harness/context/system-overview.md`.
- No cargues documentación que no corresponda al dominio de la tarea.

### 3.1 Navegación con el Grafo (graphify)

El repositorio tiene un grafo de conocimiento de `proyecto/` en `graphify-out/` (raíz del repo). Úsalo para ubicarte antes de leer código a ciegas.

- **Primero el grafo, después el código:** Para preguntas de arquitectura o de impacto ("¿qué llama a X?", "¿qué toca este ID del DOM?"), ejecuta `graphify query "<pregunta>"` o lee `graphify-out/GRAPH_REPORT.md`. Abre solo los archivos que el grafo señale.
- **Las aristas `INFERRED` y `AMBIGUOUS` no son hechos:** Antes de basar una decisión en ellas, verifícalas en el código. Solo las `EXTRACTED` vienen del AST.
- **Ignora el ruido de terceros:** La mayoría de las comunidades del grafo son funciones minificadas de `jquery.min.js`, `leaflet.js` y `leaflet.markercluster.js` (nodos como `$e()`, `re()`, `te()`). No forman parte del dominio y no se modifican (ver invariante 5 de `system-overview.md`).
- **Puntos calientes de `js/app.js`:** `bindEvents()`, `resetProgress()`, `toggleWell()` e `initMap()` son los nodos propios más conectados. Una spec que los toque debe listar en su Blast Radius los IDs de `index.html` afectados (sección 5 de `system-overview.md`) y verificarlos manualmente.
- **Puente HTML ↔ JS:** `index.html` es el nodo con mayor centralidad; renombrar un ID o un atributo `data-*` rompe la UI en silencio. Revisa el acoplamiento DOM ↔ funciones antes de tocar el marcado.
- **Mantén el grafo vigente:** Si tu spec cambió código en `proyecto/`, ejecuta `/graphify proyecto --update` al final. `graphify-out/` es generado: no cuenta para el Blast Radius y no se edita a mano.

---

## 4. Comandos Canónicos de Verificación

El stack es HTML/CSS/JavaScript ES5 estático, con librerías vendorizadas y sin `package.json` ni paso de build. Por eso los gates usan solo **Node.js (≥ 18)**, sin instalar dependencias ni acceder a la red. Ejecútalos desde la **raíz del repositorio**.

| Ámbito | Linter | Tipado | Tests |
| :--- | :--- | :--- | :--- |
| **Principal (`proyecto/`)** | Sintaxis JS (4.1) | Contrato de datos (4.2) | Integridad offline (4.3) |

**4.1 Linter: sintaxis de los scripts propios** (no incluye las librerías de terceros):

```bash
node --check proyecto/js/app.js && node --check proyecto/data/wells.js
```

**4.2 Tipado: contrato de datos de `data-contracts.md`**. Comprueba que `wells.json` y `wells.js` sean idénticos, que no haya campos de más, que los `id` sean únicos, los tipos y que las coordenadas estén dentro de `MAP_BOUNDS`:

```bash
node -e "const fs=require('fs'),vm=require('vm');const j=JSON.parse(fs.readFileSync('proyecto/data/wells.json','utf8'));const c={window:{}};vm.runInNewContext(fs.readFileSync('proyecto/data/wells.js','utf8'),c);if(JSON.stringify(j)!==JSON.stringify(c.window.TOTK_WELLS))throw new Error('wells.json y wells.js difieren');const ids=new Set();for(const r of j){if(Object.keys(r).sort().join()!=='id,name,x,y,z')throw new Error('campos '+r.id);if(!/^\d{4}[A-Z]?$/.test(r.id)||ids.has(r.id))throw new Error('id '+r.id);ids.add(r.id);if(typeof r.name!=='string'||![r.x,r.y,r.z].every(Number.isFinite))throw new Error('tipos '+r.id);if(Math.abs(r.x)>5000||Math.abs(r.y)>6000)throw new Error('fuera de MAP_BOUNDS '+r.id)}console.log('CONTRATO_OK',j.length)"
```

**4.3 Tests: integridad offline de `index.html`**. Comprueba que todo `src`/`href` local exista y que no se cargue nada por CDN (invariante 1 de `system-overview.md`):

```bash
node -e "const fs=require('fs'),p=require('path');const h=fs.readFileSync('proyecto/index.html','utf8');const refs=[...h.matchAll(/(?:src|href)=\"([^\"#]+)\"/g)].map(m=>m[1]).filter(r=>!r.startsWith('data:'));const bad=refs.filter(r=>/^(https?:)?\/\//.test(r)||!fs.existsSync(p.join('proyecto',r)));if(bad.length)throw new Error('refs invalidas: '+bad.join(', '));console.log('REFS_OK',refs.length)"
```

Ejecuta los comandos del ámbito modificado en este orden: linter, tipado y tests. Si un comando no existe en el repositorio, detente y repórtalo. No lo sustituyas por otro.

- **Una spec que agregue una categoría de datos** (por ejemplo, `outfits.*`) debe extender 4.1 y 4.2 con sus archivos y su contrato, dentro de su Blast Radius.
- **No hay tests de UI automatizados.** Si la spec cambia `index.html`, `app.js` o `styles.css`, además de los gates abre `proyecto/index.html` con `file://` y verifica a mano los flujos afectados (sección 5 de `system-overview.md`). Registra el resultado en la bitácora.

---

## 5. Estado de la Spec

Solo el desarrollador cambia el estado de la spec. El agente puede editarlo únicamente si el desarrollador se lo pide.

Estados válidos: `DRAFT`, `APPROVED`, `IN_PROGRESS`, `BLOCKED` y `COMPLETED`.

---

## 6. Memoria del Arnés

1. **Bitácora por spec:** Al iniciar una spec, crea `.harness/memory/logs/<TASK-ID>.md` a partir de `.harness/memory/logs/TEMPLATE.md`. Registra cada decisión no trivial, intento de depuración, fallo de gate, rollback y bloqueo. Solo anexa entradas: no edites ni borres las anteriores.
2. **Lecciones aprendidas:** Antes de solicitar el paso a `COMPLETED`, revisa la bitácora y propón en `.harness/memory/lessons-learned.md` las lecciones reutilizables con estado `PROPUESTA`. El desarrollador las cambia a `VIGENTE` o las descarta.
3. **Promoción:** Si una lección debe cumplirse siempre, el desarrollador la mueve a `.harness/rules/` o `.harness/context/` y la marca `PROMOVIDA`. Las reglas están por encima de las lecciones.
4. **Commits:** Commitea la memoria por separado con `chore(memory): <TASK-ID> <resumen>`. No requiere pasar los gates porque no es código.
5. **Seguridad:** No registres secretos, credenciales ni datos personales.

---

## 7. Fallos y Rollback

Si una verificación falla después de **2 intentos consecutivos de depuración**, o si detectas un cambio fuera de la spec, ejecuta `.harness/rules/rollback.md`. Esa política es la única fuente de verdad para revertir cambios.
