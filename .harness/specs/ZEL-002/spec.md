# ZEL-002: Mapas del cielo y de las profundidades con navegación entre capas

- **TASK-ID:** ZEL-002
- **Jira:** N/A
- **Estado:** COMPLETED
- **Responsable:** @odiez3
- **Rama asignada:** feat/ZEL-002-capas-cielo-profundidades
- **Ámbito:** frontend
- **Creada:** 2026-11-06
- **Entrada original:** "Crea una especificación para agregar los mapas del cielo y del subsuelo; para navegar entre los mapas se debe poder con las flechas de arriba y abajo; debe tener una animación de acuerdo a Zelda para moverse entre los mapas."

Estados válidos: Declarativo `DRAFT | APPROVED | IN_PROGRESS | BLOCKED | COMPLETED`. Solo el desarrollador cambia el estado.

---

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia principal

Como jugador de *Tears of the Kingdom*, quiero ver también los mapas del cielo y de las profundidades y pasar de uno a otro con las flechas arriba y abajo, con una transición que se sienta como subir o bajar en Hyrule, para localizar y marcar los coleccionables de las tres capas en una misma guía.

### Escenarios de aceptación

1. **Dado que** estoy en la superficie, **cuando** pulso la flecha ↑, **entonces** se reproduce la animación de ascenso y queda visible el mapa del cielo con sus marcadores.
2. **Dado que** estoy en la superficie, **cuando** pulso la flecha ↓, **entonces** se reproduce la animación de descenso y queda visible el mapa de las profundidades con sus marcadores.
3. **Dado que** estoy en el cielo, **cuando** pulso ↓, **entonces** vuelvo a la superficie con la animación de descenso; y **dado que** estoy en las profundidades, **cuando** pulso ↑, vuelvo a la superficie con la animación de ascenso.
4. **Dado que** estoy en el cielo (capa más alta), **cuando** pulso ↑, **entonces** no cambia la capa y recibo una señal breve de que no hay capa superior. Lo mismo en las profundidades con ↓.
5. **Dado que** estoy escribiendo en el buscador, **cuando** pulso ↑ o ↓, **entonces** no cambia la capa.
6. **Dado que** uso ratón o pantalla táctil, **cuando** pulso los controles visibles de subir o bajar capa, **entonces** ocurre lo mismo que con las flechas.
7. **Dado que** la categoría Atuendos está activa y cambio al cielo, **entonces** el mapa y la lista muestran solo los atuendos del cielo, y los contadores reflejan esa capa.
8. **Dado que** la categoría Pozos está activa y cambio al cielo o a las profundidades, **entonces** veo el mapa de esa capa y un aviso de que esa categoría no tiene elementos en esta capa.
9. **Dado que** marqué un atuendo de las profundidades como encontrado, **cuando** recargo la página, **entonces** sigue marcado y la guía abre en la última capa que estaba viendo.
10. **Dado que** tengo activada la preferencia de "reducir movimiento" del sistema, **cuando** cambio de capa, **entonces** el cambio es un fundido simple, sin desplazamientos.
11. **Dado que** ya tenía progreso guardado antes de esta funcionalidad, **cuando** abro la nueva versión, **entonces** conservo todos mis pozos y atuendos marcados y la guía abre en la superficie.

### Casos límite

- **Pulsaciones repetidas durante la animación:** se ignoran; una animación no se interrumpe ni se encadenan varios cambios de capa.
- **Mantener la tecla pulsada:** cuenta como una sola pulsación por animación; no se salta de golpe dos capas.
- **Modal de reinicio abierto o panel lateral en primer plano:** las flechas no cambian la capa mientras haya un diálogo abierto.
- **Imagen de una capa que no carga:** la capa se muestra con un fondo neutro, sus marcadores siguen visibles y se informa que el mapa no se pudo cargar.
- **Elemento seleccionado o con su ficha abierta al cambiar de capa:** la selección y la ficha se cierran.
- **Búsqueda o filtro activos al cambiar de capa:** se mantienen y se aplican a los elementos de la nueva capa.
- **Capa guardada inválida o corrupta:** la guía abre en la superficie.
- **Encuadre al cambiar de capa:** se conserva la misma zona y el mismo nivel de zoom, porque las tres capas comparten las coordenadas del juego.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: La guía DEBE ofrecer tres capas de mapa en orden vertical: Cielo (arriba), Superficie (centro) y Profundidades (abajo).
- **RF-002**: Cada capa DEBE mostrar su propio mapa del juego, alineado con las coordenadas de los coleccionables para que cada marcador caiga en su ubicación real.
- **RF-003**: La flecha ↑ DEBE llevar a la capa inmediatamente superior y la flecha ↓ a la inmediatamente inferior.
- **RF-004**: Las flechas ↑ y ↓ NO DEBEN cambiar la capa mientras el foco esté en un campo de texto o haya un diálogo abierto.
- **RF-005**: En la capa extrema, la flecha hacia fuera de rango NO DEBE cambiar la capa y DEBE dar una señal breve y no intrusiva de límite.
- **RF-006**: La guía DEBE ofrecer controles visibles y accesibles para subir y bajar de capa, equivalentes a las flechas, que se deshabilitan en la capa extrema correspondiente.
- **RF-007**: La guía DEBE indicar en todo momento en qué capa se está (nombre de la capa y su posición entre las tres).
- **RF-008**: Al subir DEBE reproducirse una animación de **ascenso** (el mapa actual se aleja hacia abajo con un destello luminoso y nubes que atraviesan la pantalla, y el cielo aparece desde arriba). Al bajar DEBE reproducirse una animación de **descenso** (el mapa actual se hunde, la pantalla se oscurece con un brillo tenue y las profundidades emergen desde abajo). La animación DEBE ser original, inspirada en la ambientación del juego, y durar alrededor de 1 segundo.
- **RF-009**: Si el usuario prefiere movimiento reducido, el cambio de capa DEBE ser un fundido simple sin desplazamientos ni partículas.
- **RF-010**: Durante la animación NO DEBEN aceptarse nuevos cambios de capa.
- **RF-011**: El mapa, la lista, la búsqueda, los filtros y los contadores DEBEN mostrar solo los elementos de la categoría activa que pertenecen a la capa visible.
- **RF-012**: Si la categoría activa no tiene elementos en la capa visible, la lista DEBE mostrar un aviso que lo explique, sin errores.
- **RF-013**: Los atuendos DEBEN asignarse a la capa que indican sus datos (7 en el cielo, 48 en la superficie y 30 en las profundidades). Los pozos pertenecen solo a la superficie.
- **RF-014**: El progreso (elementos encontrados) DEBE conservarse sin cambios para el usuario: lo ya marcado sigue marcado y marcar en cualquier capa se guarda igual que hoy.
- **RF-015**: La guía DEBE recordar la última capa vista y abrir en ella al volver; sin dato válido, abre en la superficie.
- **RF-016**: Al cambiar de capa DEBEN conservarse la zona y el zoom del mapa, y cerrarse la selección y la ficha abierta.
- **RF-017**: El reinicio de progreso DEBE seguir afectando a toda la categoría activa (las tres capas), y el diálogo de confirmación DEBE decirlo con claridad.
- **RF-018**: Las imágenes de los mapas del cielo y de las profundidades DEBEN quedar incluidas en el proyecto, de modo que la guía funcione sin conexión.

### Requisitos no funcionales

- **RNF-001 (sin red):** la guía sigue funcionando sin conexión y abriéndose directamente desde el archivo, en las tres capas.
- **RNF-002 (rendimiento):** la animación se ve fluida en un equipo de escritorio común; el primer cambio a una capa puede mostrar el indicador de carga, los siguientes no deben esperar a descargar nada de nuevo.
- **RNF-003 (peso):** cada imagen de mapa nueva no supera el peso de la imagen de superficie actual (~8 MB).
- **RNF-004 (accesibilidad):** los controles de capa son operables con teclado, tienen nombre accesible y el cambio de capa se anuncia a lectores de pantalla.
- **RNF-005 (origen de las imágenes):** las imágenes provienen de una fuente pública identificada, se documenta su origen y licencia o condiciones de uso, y se obtienen solo con el consentimiento del desarrollador.

### Entidades clave

- **Capa de mapa**: Cielo, Superficie o Profundidades. Tiene un nombre visible, una posición vertical, una imagen de mapa y un sentido de transición respecto a las vecinas.
- **Coleccionable**: un pozo o un atuendo, con su capa, coordenadas y estado de encontrado. Pertenece a una sola capa.
- **Preferencias del usuario**: progreso por categoría (ya existente) y última capa vista (nueva).

## Criterios de éxito *(obligatorio)*

- **CE-001**: Desde cualquier capa se llega a cualquier otra con como máximo 2 pulsaciones de flecha, y cada cambio termina en ≤ 1,2 s.
- **CE-002**: El 100 % de los 85 atuendos aparece en su capa correcta, y los conteos por capa son 7 / 48 / 30.
- **CE-003**: Al revisar al menos 5 atuendos del cielo y 5 de las profundidades contra la fuente de los datos, cada marcador cae sobre su ubicación real en el mapa de su capa.
- **CE-004**: Tras actualizar, el usuario conserva el 100 % de su progreso guardado previo.
- **CE-005**: Todo el flujo de cambio de capa se puede completar solo con teclado y solo con ratón o pantalla táctil.
- **CE-006**: Con "reducir movimiento" activado no se observa desplazamiento en la transición.

## Supuestos

- **Orden y punto de partida:** cielo arriba, profundidades abajo; la superficie es la capa inicial para quien no tiene una capa guardada. Es el orden físico del juego.
- **Coordenadas compartidas:** las tres capas usan el mismo sistema de coordenadas del juego y los mismos límites del mapa actual, por eso se conservan zona y zoom al cambiar. Si las imágenes obtenidas tuvieran otro encuadre, deben ajustarse a esos límites.
- **Contadores por capa:** el progreso que se muestra es el de la capa visible; el total de la categoría en todas las capas no se muestra en esta spec.
- **Reinicio por categoría completa:** se mantiene el comportamiento actual (toda la categoría) para no cambiar el significado de una acción destructiva; solo se aclara el texto.
- **Flechas verticales del mapa:** hoy el mapa permite desplazarse con las flechas cuando tiene el foco. Las flechas ↑/↓ pasan a cambiar de capa en toda la página (salvo campos de texto y diálogos); el desplazamiento vertical con teclado deja de estar disponible en esta spec. Las flechas ← y → no cambian.
- **Imágenes obtenidas por el agente:** el desarrollador eligió que el agente las consiga de una fuente pública (por ejemplo, el mapa de objetos de ZeldaMods), con su consentimiento previo a la descarga, igual que se hizo con los datos actuales.
- **Animación propia:** la transición es una creación original inspirada en el ambiente de Zelda (luz y nubes al subir, oscuridad y brillo tenue al bajar), sin copiar animaciones, música ni efectos del juego. No lleva sonido.

## Alcance

**Dentro:**
- Mapas del cielo y de las profundidades, incluidos en el proyecto.
- Cambio de capa con ↑/↓ y con controles visibles.
- Indicador de capa actual.
- Animaciones de ascenso y descenso, y su variante de movimiento reducido.
- Filtrado de mapa, lista, búsqueda, filtros y contadores por capa.
- Recordar la última capa vista.
- Mostrar los 7 atuendos del cielo y los 30 de las profundidades, que hoy existen en los datos pero no se muestran.

**Fuera:**
- Nuevas categorías de coleccionables o nuevos datos (santuarios, raíces, islas, etc.).
- Cambios a los datos de pozos o atuendos.
- Sonido o música en las transiciones.
- Vista simultánea o superpuesta de varias capas.
- Total de progreso combinado de todas las capas.
- Gestos táctiles (deslizar) para cambiar de capa.

## Dependencias

- **Imágenes de mapa del cielo y de las profundidades:** el agente debe obtenerlas de una fuente pública con consentimiento del desarrollador, documentar su origen y licencia, y verificar su alineación con al menos un coleccionable conocido de cada capa antes de implementar (lección del harness sobre la conversión de coordenadas de ZeldaMods). Si no se consiguen con calidad o alineación suficiente, la spec pasa a `BLOCKED`.
- **Datos de atuendos existentes:** dependen del campo de capa que ya traen (`surface`, `sky`, `depths`).
- **Límite de archivos del harness:** el cambio toca datos visuales, marcado, estilos, lógica y dos imágenes nuevas; el plan debe confirmar que cabe en el máximo de 5 archivos por spec o dividirlo en sub-specs.
