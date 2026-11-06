# Reglas de Seguridad y Comandos Restringidos

---

## 1. Sanitización de Credenciales y Secretos

- **Cero tolerancia a credenciales en duro:** Prohibido escribir API keys, tokens JWT, contraseñas de bases de datos o secretos en archivos de código, specs o documentación.
- **Archivos sensibles:** El agente tiene prohibido leer, modificar o incluir en commits:
  - `.env` y `.env.*`, excepto `.env.example`
  - Claves privadas (`id_rsa`, `*.pem`, `*.key`)
  - Credenciales de proveedores cloud (`~/.aws/`, `~/.config/gcloud/`)

---

## 2. Comandos de Terminal Estrictamente Prohibidos

El agente no debe ejecutar bajo ninguna circunstancia:

- **Comandos destructivos de Git:** `git push --force`, `git reset --hard`, `git rebase`, `git clean`, `git stash drop`.
- **Saltos de validación:** cualquier comando con `--no-verify`.
- **Eliminación recursiva o masiva:** `rm -rf` sobre cualquier ruta, incluidos `/`, `*`, `.` y carpetas del proyecto.
- **Alteraciones de base de datos en caliente:** comandos CLI directos contra bases de datos en producción o sin flag de migración.
- **Instalación de paquetes sin justificación:** `npm install <libreria>` o `pip install <libreria>`, a menos que la spec activa lo autorice explícitamente.

Si un cambio requiere revertirse, aplica `rollback.md`.
