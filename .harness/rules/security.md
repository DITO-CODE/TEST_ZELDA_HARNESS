# Reglas de Seguridad y Comandos Restringidos

---

## 1. Credenciales y Secretos

- **Cero credenciales en duro:** prohibido escribir API keys, tokens, contraseñas o secretos en código, specs, documentación, bitácoras o logs de ejecución.
- **Archivos sensibles:** el agente no lee, modifica ni incluye en commits:
  - `.env` y `.env.*`, excepto `.env.example`
  - Claves privadas (`id_rsa`, `*.pem`, `*.key`)
  - Credenciales de proveedores cloud (`~/.aws/`, `~/.config/gcloud/`, `~/.azure/`)

---

## 2. Comandos Estrictamente Prohibidos

- **Git destructivo:** `git push --force`, `git reset --hard`, `git rebase`, `git clean`, `git stash drop`.
- **Saltos de validación:** cualquier comando con `--no-verify`.
- **Eliminación recursiva o masiva:** `rm -rf` sobre cualquier ruta.
- **Bases de datos en caliente:** comandos contra bases de datos reales o de producción. Las migraciones **solo se generan** (`prisma migrate dev --create-only`, `alembic revision`, `dotnet ef migrations add`, archivo Flyway nuevo…); nunca se aplican desde el agente.
- **Instalación de paquetes sin autorización:** `npm install <x>`, `pip install <x>`, `mvn dependency:get`, `dotnet add package`, etc., salvo que la spec activa lo autorice.

---

## 3. Herramientas que Requieren Consentimiento

Estas acciones solo se ejecutan si el desarrollador lo autoriza en la sesión:

- Instalar skills (`agentes-desarrollo/install.sh`) o herramientas (`uv tool install graphifyy`, `graphify install`).
- Construir o actualizar el grafo de graphify (`/graphify .`).
- Instalar hooks de Git (`graphify hook install` u otros).
- Llamadas de prueba a modelos externos que consumen cuota (`audit_gate.sh --probe`).

Si un cambio requiere revertirse, aplica `rollback.md`.
