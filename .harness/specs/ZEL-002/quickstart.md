# Quickstart de validación: ZEL-002

## Prerrequisitos

- Rama `feat/ZEL-002-capas-cielo-profundidades` y repositorio limpio.
- Node.js ≥ 18 para los gates.
- Python 3 con Pillow y acceso a la red **solo** para la tarea de imágenes, con consentimiento del desarrollador.
- Chrome. La extensión no abre `file://`, así que la verificación automatizada usa `python3 -m http.server` desde `proyecto/`. La verificación final se hace también abriendo `proyecto/index.html` con `file://`.

## 1. Imágenes (antes de tocar código)

```bash
python3 .harness/runs/ZEL-002/tools/stitch_tiles.py --layer Ground --out .harness/runs/ZEL-002/ground-check.jpg
python3 .harness/runs/ZEL-002/tools/stitch_tiles.py --compare .harness/runs/ZEL-002/ground-check.jpg proyecto/assets/img/surface.jpg
python3 .harness/runs/ZEL-002/tools/stitch_tiles.py --layer Sky    --out proyecto/assets/img/sky.jpg
python3 .harness/runs/ZEL-002/tools/stitch_tiles.py --layer Depths --out proyecto/assets/img/depths.jpg
```

**Esperado:** `ground-check.jpg` mide 6000 × 5000 y la comparación da un error medio < 12/255. `sky.jpg` y `depths.jpg` miden 6000 × 5000 y pesan ≤ 7 905 335 bytes. Los recortes alrededor de `0051` (cielo) y `0057` (profundidades) muestran terreno coherente.

## 2. Gates (`AGENTS.md` §5)

Ejecuta 5.1, 5.2 y 5.3 desde la raíz. **Esperado:** `CONTRATO_OK wells=58 outfits=85` y `REFS_OK <n>` con código 0.

Comprobación adicional (constitución VI), que confirma que las imágenes de capa existen y son locales:

```bash
node -e "const fs=require('fs');const s=fs.readFileSync('proyecto/js/app.js','utf8');const imgs=[...s.matchAll(/\"(assets\/img\/[a-z]+\.jpg)\"/g)].map(m=>m[1]);if(imgs.length<3)throw new Error('faltan capas');for(const i of imgs)if(!fs.existsSync('proyecto/'+i))throw new Error('falta '+i);console.log('CAPAS_OK',imgs.join(','))"
```

## 3. Escenarios manuales

| # | Pasos | Resultado esperado |
| :-: | :--- | :--- |
| 1 | En superficie, pulsa ↑ | Animación de ascenso; mapa del cielo; indicador "Cielo · 1/3"; con Atuendos, 7 en la lista |
| 2 | Desde cielo, pulsa ↓ dos veces (esperando a que termine) | Superficie y luego Profundidades (30 atuendos), con animación de descenso |
| 3 | En profundidades, pulsa ↓ | No cambia; señal breve de límite; botón "bajar" deshabilitado |
| 4 | Mantén ↑ pulsada desde profundidades | Sube una sola capa por animación; no salta a cielo de golpe |
| 5 | Pulsa ↑ varias veces durante la animación | Se ignoran |
| 6 | Escribe en el buscador y pulsa ↑/↓ | El cursor se mueve; no cambia la capa |
| 7 | Abre el modal de reinicio y pulsa ↑ | No cambia la capa |
| 8 | Usa los botones subir/bajar con el ratón | Igual que las flechas |
| 9 | Categoría Pozos, sube a cielo | Mapa del cielo y estado vacío "No hay pozos en Cielo" |
| 10 | Marca un atuendo de profundidades y recarga | Sigue marcado; la guía abre en Profundidades |
| 11 | Con progreso previo de pozos y atuendos, carga la nueva versión | Todo el progreso intacto; abre en Superficie |
| 12 | Activa "Reducir movimiento" en el sistema y cambia de capa | Solo un fundido, sin desplazamientos |
| 13 | Con búsqueda "cap" activa, cambia de capa | La búsqueda se mantiene y filtra en la nueva capa |
| 14 | Selecciona un marcador con su ficha abierta y cambia de capa | Selección y ficha cerradas; misma zona y zoom |
| 15 | Renombra temporalmente `sky.jpg` (en el servidor local) y sube | Fondo neutro, marcadores visibles y aviso de error (deshaz el renombre) |
| 16 | Pon `totk.map.layer.v1 = "xyz"` en DevTools y recarga | Abre en Superficie |
| 17 | Con el lector de pantalla o el árbol de accesibilidad, cambia de capa | Se anuncia "Capa: Cielo" y los botones tienen nombre accesible |
| 18 | Mide tres cambios de capa | Cada uno termina en ≤ 1,2 s (CE-001) |

Registra en la bitácora el resultado de cada escenario.
