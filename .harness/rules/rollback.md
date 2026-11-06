# Política de Rollback

Esta es la única fuente de verdad para revertir cambios. Aplica al arnés declarativo y al federado.

**Principios:**

- Conserva el trabajo fallido para que pueda revisarse.
- Toca únicamente los cambios de la tarea actual.
- Nunca borres trabajo ajeno.
- Un agente solo actúa sobre el repositorio donde se está ejecutando.

---

## 1. Cuándo Aplicar

Ejecuta el rollback si ocurre cualquiera de estos casos:

- La verificación sigue fallando después de **2 intentos consecutivos de depuración**.
- Modificaste un archivo fuera de la lista autorizada por la spec.
- Introdujiste un secreto o una dependencia no autorizada.
- El cambio dejó el repositorio en un estado inconsistente.
- Encontraste una incompatibilidad con otra fase que no se resuelve dentro de este repositorio.

Después de 2 intentos fallidos no hagas un tercero.

---

## 2. Rollback Local

El protocolo de arranque garantiza que el repositorio estaba limpio al iniciar. Por eso, los cambios sin commit pertenecen a la tarea actual.

Si no puedes confirmar que el repositorio estaba limpio, detente y consulta al desarrollador sin ejecutar estos pasos.

1. **Guarda el trabajo fallido, incluidos los archivos nuevos, sin tocar la memoria:**

   ```bash
   git stash push --include-untracked -m "rollback/<TASK-ID>/<YYYY-MM-DD>" -- . ':(exclude).harness/memory'
   ```

   La exclusión mantiene la bitácora en el árbol de trabajo para poder registrar el rollback.
2. **Confirma el resultado:** `git status --short` solo puede mostrar archivos de `.harness/memory/`.
3. **Comprueba la base:** Ejecuta los gates del repositorio.
   - Si pasan, la base está estable.
   - Si fallan, repórtalo. No intentes corregirlo: el problema está en un commit o existía antes.
4. **Registra el rollback:** Anexa una entrada `ROLLBACK` a la bitácora de la tarea con la causa raíz, el nombre del stash y el estado de la base. Commitea solo la memoria con `chore(memory): rollback <TASK-ID>`, para que la siguiente sesión arranque con el repositorio limpio.
5. **Reporta en consola** con el formato de la sección 5 y **detente**.

**Archivos ignorados:** El stash no guarda ni elimina los archivos que coinciden con `.gitignore`. Si la tarea creó alguno, indícalo en el reporte.

**Si el secreto quedó en el stash:** Indícalo en el reporte. El desarrollador debe rotarlo y eliminar ese stash.

### Commits ya creados

- No reescribas el historial. El agente no ejecuta `git reset --hard`, `git push --force` ni `git rebase`.
- No reviertas commits por iniciativa propia. Reporta el hash afectado y deja que el desarrollador decida.
- Si el desarrollador lo autoriza, usa `git revert <hash>`, que conserva el historial.

### Cambios fuera de Git

Git no revierte migraciones aplicadas, datos modificados ni llamadas a servicios externos. Si ocurrió alguno de estos casos, indícalo en el reporte. No intentes compensarlo sin autorización.

### Recuperar el trabajo

El desarrollador puede revisar y recuperar el trabajo fallido con:

```bash
git stash list
git stash show --include-untracked stash@{N}
git stash apply stash@{N}
```

Debe eliminarlo cuando ya no lo necesite con `git stash drop stash@{N}`.

---

## 3. Rollback en Cascada (Arnés Federado)

Aplica cuando una fase detecta una falla que no puede resolverse dentro de su propio repositorio.

**En el satélite que detecta la falla:**

1. Ejecuta el rollback local de la sección 2.
2. No crees adaptadores que oculten el error de otra fase.
3. Reporta la fase que detectó la falla, la que la originó y la causa raíz.
4. Detente. No modifiques `harness-core` ni otro satélite.

**En `harness-core`:** El desarrollador clasifica la falla y actualiza la spec.

| Causa | Estado de la spec | Siguiente paso |
| :--- | :--- | :--- |
| El contrato es correcto y la implementación falló | `FAILED_PHASE_[X]`, donde `X` es la fase que originó la falla | Corregir en el satélite de la fase `X` |
| El contrato es inviable o está incompleto | `BLOCKED_REVIEW` | Revisar y versionar el contrato antes de retomar el código |

Registra la causa raíz clasificada en la bitácora consolidada `harness-core/.harness/memory/logs/SPEC-<ID>.md`. El detalle técnico queda en la bitácora de fase del satélite.

**Para retomar:**

1. Corrige la falla desde su origen con un commit nuevo. No reescribas los commits de esa fase.
2. Vuelve a pasar los gates de la fase corregida.
3. Vuelve a pasar los gates de **todas las fases posteriores** que ya estaban terminadas.
4. El desarrollador regresa la spec a `IN_PROGRESS`.

Si los commits ya llegaron a una rama compartida o a producción, el desarrollador decide si corregir hacia adelante o aplicar `git revert` mediante PR en cada repositorio afectado.

---

## 4. Lo que Nunca Debes Hacer

- Ejecutar `git clean`, `git checkout -- .` o `git restore .`, porque destruyen cambios sin conservarlos.
- Borrar archivos no rastreados para limpiar el repositorio.
- Modificar o desactivar tests para evitar el rollback.
- Usar `--no-verify` para saltar validaciones.
- Eliminar un stash de rollback.
- Hacer commit de código que no pasó los gates.

---

## 5. Reporte Obligatorio

```text
[ROLLBACK EJECUTADO]
Spec: <TASK-ID o SPEC-ID>
Repositorio: <nombre>
Fase detectada: <número o N/A>
Fase de origen: <número, N/A o desconocida>
Motivo: <causa raíz en una o dos líneas>
Suposición incorrecta de la spec: <detalle o Ninguna>
Stash: <nombre o Sin cambios>
Bitácora: <ruta del archivo de .harness/memory/logs/>
Commits afectados: <hashes o Ninguno>
Efectos fuera de Git: <detalle o Ninguno>
Estado de la base: <gates OK o gates FALLANDO>
Siguiente acción requerida: <qué debe decidir el desarrollador>
```
