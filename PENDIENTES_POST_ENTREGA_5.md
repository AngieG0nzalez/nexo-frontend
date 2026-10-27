# Pendientes tras la auditoría posterior a la Entrega 5

## Corregido en esta ronda (pytest SQLite: 15 passed; `npm run build` PASS)
- **A1** Registro: el apellido se une al nombre (máx. 50+50); se quitaron `specialty` y `message`, que el backend descartaba. La especialidad se completa en «Mi perfil» (A8). Sin cambios de esquema.
- **A3** Grado: `/adaptive/topics/{id}/next` y `POST /attempts` devuelven 403 si el tema no es del grado del estudiante o si no tiene perfil con grado.
- **A6** Mensajes: el estudiante solo escribe a tutores activos; el tutor solo a alumnos inscritos en sus clases (no cancelados) o que ya le escribieron.
- **A7** `/health` responde 503 si falla la BD.
- **A8** «Mi perfil» del tutor edita especialidad, experiencia y biografía (`PATCH /tutors/{id}`).
- **A11** `requirements.txt` en UTF-8, `requirements-dev.txt` con pytest, dependencias del frontend con versión fija (`^` sobre las del lock).
- **A2 (parcial)** `POST /topics/{id}/exercises` ahora bloquea el tema igual que `/content/exercises`, con las mismas reglas de duplicados.

## Pendiente
**Alta**
1. **A2** Migrar `TutorQuestionsPanel` a `/content/*` y retirar los endpoints de escritura legados (requiere regresión en navegador).
2. **A4** Progreso por alumno visible al tutor (endpoint nuevo + UI).
3. **A5** Catálogo e inscripción de clases para el estudiante (UI nueva).
4. `GET /topics/{id}/exercises` es público (sin `is_correct`). Valorar exigir sesión.

**Media**
5. **A9** Transiciones de estado de clase y acciones completar/cancelar.
6. **A10** Límite de intentos de login.
7. **A12** Revisar en modo lectura los estudiantes sin `student_profiles` (con A3 quedan bloqueados para practicar); verificar correo real desde Render.
8. Pruebas HTTP por rol con Postgres de prueba y pruebas en navegador (NO EJECUTADO).

**Baja**
9. `ENTREGA_1_REPORTE.md`; scripts `lint`/`test` en el frontend.
