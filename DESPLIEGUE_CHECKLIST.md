# Checklist de despliegue (instrucciones; nada ejecutado)

## 1. Antes de desplegar
- [ ] Backup de la base de datos en Supabase.
- [ ] Confirmar migraciones aplicadas: `migrations/001_create_suggestions.sql` (ya aplicada). Rollback: `001_create_suggestions_rollback.sql`.
- [ ] `pytest tests -q`, `compileall`, `npm run build` en verde.
- [ ] Verificar que ningún `.env` ni secreto esté en el repositorio.

## 2. Variables de entorno
Backend (Render): `user`, `password`, `host`, `port`, `dbname`, `secret_key` (larga y aleatoria), `algorithm`, `access_token_expire_minutes`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `FRONTEND_URL` (URL pública del frontend), `CORS_ORIGINS` (URL pública del frontend, sin barra final).

Frontend: `VITE_API_URL` (URL pública del backend) — se fija en build.

## 3. Backend (Render)
- Build: `pip install -r requirements.txt` (si falla por UTF-16, reconvertir a UTF-8).
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Smoke: `GET /health` → 200; `/docs` carga; login con usuario de prueba.

## 4. Frontend
- `npm ci && npm run build`; publicar `dist/`.
- SPA routing: regla de reescritura de todas las rutas a `/index.html`.
- Verificar que las llamadas apunten al backend (pestaña Network) y que no haya error CORS.

## 5. Pruebas de humo posteriores
- Login por rol (estudiante, tutor, admin) y redirección.
- Recuperación de clave: llega correo con enlace a `FRONTEND_URL`.
- Práctica: no se ve la respuesta correcta antes de responder.
- Tutor: crear pregunta (4 opciones) y rechazar duplicado.
- Admin: asignar/retirar materia; sugerencias.
- Cold start: esperar primera respuesta lenta (Render gratuito) y reintentar.

## 6. Rollback
- Frontend: redeploy de la versión anterior.
- Backend: redeploy del commit anterior.
- BD: solo con el script de rollback correspondiente y tras backup; nunca borrar datos manualmente.
