# Constitución de la spec ZEL-002: Mapas del cielo y de las profundidades con navegación entre capas

**Versión:** 1.0.0
**Ratificada:** 2026-11-06
**Última enmienda:** 2026-11-06

## Alcance

Aplica solo a la spec `ZEL-002`. Está subordinada, en este orden, a `AGENTS.md`, `.harness/rules/`, los contratos y `.harness/context/`. Si un principio entra en conflicto con ellos, mandan ellos.

## Reglas superiores que esta spec hereda

- Quality gates: `AGENTS.md` §5
- Blast Radius y ramas: `AGENTS.md` §1 y `.harness/rules/git-workflow.md`
- Seguridad y consentimiento para descargas: `.harness/rules/security.md`
- Invariantes y acoplamiento DOM ↔ funciones: `.harness/context/system-overview.md` §2 y §5
- Contratos de datos y persistencia: `.harness/context/data-contracts.md` §2 y §3 (no hay OpenAPI)

## Principios de la spec

### I. Capas declaradas en un solo lugar

El orden, el nombre visible y la imagen de cada capa se definen en un único punto. La pertenencia de un coleccionable a una capa se deriva de sus datos; los pozos se tratan como superficie. Ningún conteo por capa (7 / 48 / 30) se escribe a mano en el marcado ni en el código.

**Razón:** evita que capas, textos y contadores se desincronicen y permite agregar capas o categorías sin tocar varios sitios.

### II. Un único camino para cambiar de capa

El teclado, los controles visibles y la restauración de la capa guardada usan la misma operación de cambio de capa. Solo esa operación bloquea entradas durante la animación y cierra la selección y la ficha abierta.

**Razón:** garantiza que RF-010 y RF-016 se cumplan igual en todas las vías de entrada.

### III. Animación original, nativa y acotada

La transición se construye sin librerías nuevas ni recursos remotos, y sin sprites, sonidos ni efectos extraídos del juego. Dura como máximo 1,2 s y siempre deja el mapa usable al terminar, aunque se interrumpa. Con "reducir movimiento" es solo un fundido.

**Razón:** cumple CE-001 y CE-006, mantiene la guía offline y evita copiar material del juego.

### IV. El progreso no se toca

Las claves de progreso existentes se usan sin cambio de formato ni migración. La última capa vista se guarda en una clave nueva, versionada e independiente.

**Razón:** CE-004 exige conservar el 100 % del progreso previo.

### V. Imágenes verificadas antes del código

Las imágenes de cielo y profundidades se descargan con consentimiento del desarrollador; su origen, URL y licencia o condiciones de uso se registran en la bitácora, y su alineación se comprueba con al menos un coleccionable conocido por capa. Hasta superar esa verificación no se modifica la lógica. Cada imagen pesa como máximo lo mismo que la imagen de superficie actual.

**Razón:** sin imágenes alineadas la funcionalidad no tiene valor (CE-003) y la spec debe pasar a `BLOCKED` antes de invertir en código.

### VI. Cada capa se verifica a mano

La verificación manual con `file://` recorre las tres capas, ambos sentidos con flechas y con controles, los límites, la persistencia de capa y "reducir movimiento", y confirma que las imágenes nuevas son locales (el gate 5.3 solo revisa `index.html`). El resultado se registra en la bitácora.

**Razón:** no hay tests de UI automatizados y la referencia a las imágenes no la cubre ningún gate.

## Restricciones técnicas propias de esta spec

- JavaScript ES5, sin dependencias nuevas.
- No se editan las librerías vendorizadas; el desplazamiento vertical del mapa con flechas se desactiva sin tocarlas.
- No se agregan atajos de teclado distintos de ↑ y ↓.

## Gobierno

- Las enmiendas las aprueba el desarrollador responsable de la spec.
- Un plan que no cumpla un principio de esta constitución debe justificar la excepción en `plan.md` (Excepciones). Una excepción a `AGENTS.md` o a `.harness/rules/` nunca se justifica ahí.
- Versionado: MAJOR = principio eliminado o redefinido, MINOR = principio agregado, PATCH = redacción.

## Registro de enmiendas

| Fecha | Versión | Cambio |
| :--- | :--- | :--- |
| 2026-11-06 | 1.0.0 | Ratificación inicial. |
