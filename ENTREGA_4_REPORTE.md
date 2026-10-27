# ENTREGA 4 — Administración, materias de tutores, banco de preguntas y sugerencias

No se avanzó a la Entrega 5 ni a IA. Entregas 1, 2 y 3 (ampliada) se conservaron.

## 1. Inventario antes / después

**Ya existía (reutilizado, no reimplementado):** `GET /admin/users`, `GET /admin/users/{id}`, `PATCH /admin/users/{id}/status`, `PATCH /admin/users/{id}` (edición administrativa con auditoría), `GET/POST/PATCH/DELETE /subjects`, `GET /tutor-panel/*`, temas (`POST/PATCH /topics`), clases, `/messages`, `/topics/{id}/exercises/*` de la ampliación de E3.

**Nuevo en esta entrega**

| Método y ruta | Rol | Notas |
|---|---|---|
| `GET /admin/tutors/{tutor_id}/subjects` | admin | `[{subject_id,name,grade,assigned_at}]`. 404 tutor inexistente |
| `POST /admin/tutors/{tutor_id}/subjects` `{subject_id}` | admin | 201; 404 tutor/materia; 409 duplicada o tutor inactivo |
| `DELETE /admin/tutors/{tutor_id}/subjects/{subject_id}` | admin | 204; 404 sin asignación; 409 si hay clases `scheduled` de esa materia |
| `GET /content/catalog` | admin / tutor | materias (tutor: solo asignadas) → temas con contadores activos/inactivos |
| `GET /content/exercises?topic_id&subject_id&grade&difficulty&is_active&q&limit&offset` | admin / tutor | `{items,total,limit,offset}`, incluye `is_correct` y `attempts_count`. Tutor sin materia → 403 |
| `POST /content/exercises` | admin / tutor | 201; 4 opciones, 1 correcta; 409 duplicado en el tema; 403 sin materia |
| `PATCH /content/exercises/{id}` | admin / tutor | sin intentos: edición completa; con intentos: solo dificultad/explicación, el resto 409 |
| `PATCH /content/exercises/{id}/status` `{is_active}` | admin / tutor | desactivación lógica; reactivar valida duplicado |
| `POST /content/exercises/{id}/new-version` | admin / tutor | crea ejercicio nuevo y desactiva el anterior en una transacción |
| `POST /suggestions`, `GET /suggestions/mine` | student / tutor | solo propias; límite 5 envíos por 10 min (429) |
| `GET /admin/suggestions?status&category`, `PATCH /admin/suggestions/{id}` | admin | estado + `admin_note`; no expone correos |

**Cambio sobre lo anterior:** `ExerciseCreate` (usado por `POST /topics/{id}/exercises` de la ampliación de E3) ahora exige exactamente 4 opciones (antes 2–6), según este documento. El formulario del panel del tutor se ajustó a 4 opciones fijas. Esas rutas siguen funcionando.

Frontend: menú Admin (Solicitudes, Usuarios, Asignaciones, Banco de preguntas, Sugerencias); Tutor (Panel, Mensajes, Banco de preguntas, Enviar sugerencia, Mis sugerencias); Estudiante (+ Enviar sugerencia, Mis sugerencias).

## 2. Archivos

**Backend creados:** `app/routers/admin_tutor_subjects.py`, `app/routers/content.py`, `app/routers/suggestions.py`, `app/schemas/content.py`, `app/schemas/suggestion.py`, `app/models/suggestion.py`, `migrations/001_create_suggestions.sql`, `migrations/001_create_suggestions_rollback.sql`.
**Backend modificados:** `app/main.py`, `app/models/__init__.py`, `app/schemas/exercise.py` (4 opciones), `app/schemas/tutor.py` (schemas de asignación).
**Frontend creados:** `api/content.api.js`, `api/suggestions.api.js`, `pages/Admin/{AdminUsersPage,AdminAssignmentsPage,AdminSuggestionsPage}.jsx`, `pages/Admin/Management.css`, `pages/Content/QuestionBankPage.jsx`, `pages/Suggestions/SuggestionsPage.jsx`.
**Frontend modificados:** `api/admin.api.js` (se agregaron funciones), `routes/AppRoutes.jsx`, `components/Sidebar/Sidebar.jsx`, `pages/Tutor/TutorQuestionsPanel.jsx` (4 opciones fijas).

## 3. Decisiones

- **Edición de usuarios (A):** el `PATCH /admin/users/{id}` ya existía (nombre, grado 9–11, datos de tutor, auditoría, rechaza admins). Solo se construyó la UI, con confirmación de cambio de grado.
- **Retiro de materia (B):** se bloquea con 409 si el tutor tiene clases `scheduled` de esa materia. No se borra ninguna materia, tema, clase ni ejercicio. Los temas son compartidos y no pertenecen al tutor, así que no bloquean. Tras el retiro, `get_active_tutor_for_subject` devuelve 403 al tutor.
- **Edición con intentos (C):** si hay intentos, se bloquea cambiar enunciado/opciones (409) y se ofrece «Crear nueva versión» (nuevo ejercicio + nuevas opciones, el anterior queda inactivo). Sin intentos se actualizan las opciones existentes en el lugar (mismos IDs). La dificultad y la explicación siempre se pueden editar.
- **Desactivar, nunca borrar:** `is_active=false`; la práctica y el adaptativo ya filtran por `is_active`. La ruta `DELETE` de E3 ampliada también es lógica.
- **Duplicados:** enunciado normalizado (espacios, mayúsculas) entre preguntas activas del mismo tema → 409. Para mitigar la concurrencia se bloquea la fila del tema (`FOR UPDATE`) al crear. No hay índice único (requeriría migración revisada). Coincidencias en otros temas de la misma materia solo devuelven `warning` (no bloquean).
- **Respuestas correctas:** solo en `/content/*` y `/topics/{id}/exercises/manage` (admin/tutor autorizado). Los endpoints de práctica no cambiaron y no exponen `is_correct`.
- **Auditoría:** se usó `account_audit` existente para asignar/retirar materias; sugerencias y banco no auditan (no hay infraestructura compatible).

## 4. Migración `suggestions`

Archivos: `migrations/001_create_suggestions.sql` (idempotente, solo crea la tabla `suggestions` y 2 índices) y `001_create_suggestions_rollback.sql` (`DROP TABLE IF EXISTS suggestions`).

**Estado real: NO APLICADA.** No se tocó Supabase. Hasta que se aplique, `POST /suggestions`, `GET /suggestions/mine` y `/admin/suggestions` devolverán 500; el resto de la aplicación no se ve afectada.
Aplicar: ejecutar el SQL en el editor de Supabase o con `psql "$DATABASE_URL" -f migrations/001_create_suggestions.sql`. Revertir: ejecutar el archivo de rollback.

## 5. Matriz de pruebas

Evidencia = ejecución de las funciones de los routers sobre SQLite en memoria (lógica y permisos; **no** PostgreSQL, **no** HTTP). Todo lo demás: NO EJECUTADO.

| ID | Resultado | Evidencia / nota |
|---|---|---|
| E4-01, E4-02, E4-03, E4-04, E4-05 | NO EJECUTADO | Endpoint ya existente; UI nueva sin probar en navegador |
| E4-06 | NO EJECUTADO | |
| E4-07 | PASS (lógica) | Asignación creada; el panel del tutor no se probó en navegador |
| E4-08 | PASS (lógica) | 409 en duplicado |
| E4-09 | NO EJECUTADO | Sin ruta de autoasignación para tutores (solo `require_admin`) |
| E4-10 | PASS (lógica) | 409 con clase programada; retiro OK al completarla; sin borrar contenido |
| E4-11 | PASS (lógica) | Tutor sin materia: 403 al crear y al listar |
| E4-12 | PASS (lógica) | Filtro por tutor/materia; nombres reales |
| E4-13 | PASS (lógica) | Creación con 4 opciones y 1 correcta |
| E4-14 | PASS (schema) | 3 y 5 opciones, y 2 correctas, rechazadas por Pydantic (→ 422) |
| E4-15 | PASS (lógica) | 409, incluso con distinta capitalización y espacios |
| E4-16 | NO EJECUTADO | Por diseño, los endpoints de práctica no tienen `is_correct`; no se re-probó por HTTP |
| E4-17 | PASS (lógica) | Edición sin intentos |
| E4-18 | PASS (lógica) | 409 con intentos; nueva versión conserva el intento original |
| E4-19 | PASS (lógica) | Desactivación; historial intacto. La práctica no se probó por HTTP |
| E4-20, E4-21 | PASS (lógica) | Creación y consulta propia (estudiante; tutor ve 0 ajenas) |
| E4-22 | PASS (lógica) | `/mine` filtra por usuario |
| E4-23 | PASS (lógica) | Cambio de estado y nota; sin auditoría |
| E4-24 | PASS (lógica) | Admin-only por dependencia; no probado por HTTP |
| E4-25 | NO EJECUTADO | Migración sin aplicar |
| RG4-01 `npm run build` | PASS | |
| RG4-02 `compileall` | PASS | |
| RG4-03 import y OpenAPI | PASS | `import app.main` correcto, sin rutas duplicadas |
| RG4-04 … RG4-07 | NO EJECUTADO | Regresiones E1–E3 y admin sin probar en navegador |
| RG4-08 (315 / 1260) | NO EJECUTADO | No hubo acceso a la BD; no se ejecutó ningún reseed ni borrado |

## 6. Riesgos y pendientes

- Sin índice único para duplicados (mitigado con bloqueo del tema).
- Sin pruebas HTTP/PostgreSQL/navegador; `with_for_update` no se ejerció en SQLite.
- Reiniciar uvicorn y aplicar la migración antes de probar sugerencias.
- Los estudiantes con intento previo en una pregunta nueva-versión no la "heredan": es un ejercicio distinto.

## 7. Validación manual

**Bruno** (token admin, luego tutor): `POST /admin/tutors/{id}/subjects` ×2 (201, 409); `DELETE` con clase `scheduled` (409); `POST /content/exercises` con 4 opciones (201), repetido (409), con 3 opciones (422); `PATCH /content/exercises/{id}` con intentos (409); `POST …/new-version`; `PATCH …/status`; token estudiante en `/content/exercises` (403); `POST /suggestions` y `GET /suggestions/mine`; `PATCH /admin/suggestions/{id}` con token no admin (403).
**React:** `/admin/users` (filtros, editar, cambiar grado con confirmación), `/admin/assignments`, `/admin/questions` y `/tutor/questions`, `/suggestions/new` y `/suggestions`, `/admin/suggestions`.

## 8. Preservación y límite

Se conservaron E1, E2 y E3 (incluidas las ampliaciones: correos HTML, bloqueo del reenvío de recuperación, panel con pestañas, gestión de preguntas por tema). No se avanzó a la Entrega 5 ni a IA.
