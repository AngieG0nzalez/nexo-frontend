# Nexo · Frontend React + Vite

Frontend de la plataforma de tutorías de matemáticas Nexo. Consume la API FastAPI del repositorio `tutorias-backend-completo`.

## Funcionalidades por rol

**Todos:** login, recuperación/restablecimiento de contraseña, restauración de sesión, rutas protegidas por rol, perfil (`/profile`: nombre, contraseña, cambio de correo con confirmación en `/confirm-email`).

**Estudiante**
- `/topics`, `/exercise`: práctica adaptativa por tema.
- `/progress`: progreso e intentos.
- `/messages`: mensajes con tutores.
- `/suggestions`, `/suggestions/new`: sugerencias (límite de envíos en el backend).

**Tutor** (`/tutor`, panel con pestañas Resumen / Clases / Temas y preguntas)
- Gestión de clases, temas y preguntas por tema (4 opciones, una correcta, detección de duplicados).
- `/tutor/questions`: banco de preguntas de sus materias asignadas.
- `/tutor/messages`, `/tutor/suggestions`.

**Administrador**
- `/admin`: resumen y solicitudes de registro.
- `/admin/users`: búsqueda y edición de usuarios.
- `/admin/assignments`: asignación tutor–materia.
- `/admin/questions`: banco de preguntas (crear, editar, retirar, nueva versión).
- `/admin/suggestions`: revisión de sugerencias.

## Instalación

Requiere Node.js LTS y npm.

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173 · Backend local: http://127.0.0.1:8000

## Configuración

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de FastAPI, sin barra final. Si no se define, usa `http://127.0.0.1:8000`. |

Se define en un archivo `.env.local` (desarrollo) o en las variables de entorno del hosting (producción). Es una variable de **build**: si cambia, hay que volver a compilar. No incluyas secretos: todo lo que empieza por `VITE_` queda expuesto en el navegador.

El backend debe permitir el origen del frontend en `CORS_ORIGINS` y usar `FRONTEND_URL` para los enlaces de los correos (`/reset-password?token=...` y `/confirm-email?token=...`).

## Scripts

```bash
npm run dev      # desarrollo
npm run build    # compilación a dist/
npm run preview  # servir dist/ localmente
```

No hay scripts de lint ni de pruebas automáticas en el frontend (ver `PENDIENTES_POST_ENTREGA_5.md`).

## Despliegue

- Publica el contenido de `dist/`.
- Configura reescritura SPA: todas las rutas deben servir `/index.html`.
- Sigue `DESPLIEGUE_CHECKLIST.md`.

## Seguridad y notas

- El JWT se guarda en `sessionStorage` (se elimina al cerrar la pestaña). Para usuarios reales se recomienda migrar a cookies HttpOnly y reforzar la protección contra XSS.
- Si el backend responde 401 en una petición autenticada, se cierra la sesión.
- Las rutas del cliente son solo ayuda de navegación: **FastAPI es la autoridad** para permisos y datos.
- No uses una base de datos de producción para pruebas destructivas.

## Documentación de entregas

`ENTREGA_2_REPORTE.md`, `ENTREGA_3_REPORTE.md`, `ENTREGA_4_REPORTE.md`, `ENTREGA_5_REPORTE.md`, `DESPLIEGUE_CHECKLIST.md`, `PENDIENTES_POST_ENTREGA_5.md`. No existe reporte de la Entrega 1.
