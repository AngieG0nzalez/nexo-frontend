# Entrega 3 ampliada — Reporte

## Resumen funcional

- `/tutor`: tarjetas del resumen, materias asignadas, clases con fechas/duración/estado, estudiantes de cada clase, creación/edición controlada de clases y gestión de temas de materias asignadas.
- `/tutor/messages`: comparte mensajería con estudiante; destinatarios se resuelven desde contactos existentes y estudiantes de clases propias.
- Se preservan `/profile`, perfil/cambio de clave/correo, `/progress`, `/topics`, `/exercise`, y navegación de estudiante/admin. Sin cambios SQL ni migraciones.
- Ediciones de temas son compartidas por materia; se advierte y solicita confirmación. No hay auditoría existente que registre quién/cuándo editó.

## Rutas y autorización

| Método y ruta | Autorización | Uso |
|---|---|---|
| `GET /tutor-panel/me`, `/summary`, `/classes`, `/subjects` | Tutor autenticado | Panel, resumen, clases y materias |
| `GET /tutor-panel/classes/{id}/students` | Tutor autenticado; solo su clase (404 para ajena) | Lista de estudiantes inscritos |
| `POST /classes` | Tutor o admin como existía; tutor debe estar activo, usar su propio `tutor_id` y tener asignada la materia | Crear clase |
| `PATCH /classes/{id}` | Tutor propietario o admin; tutor activo; tutor solo puede editar clase `scheduled`; cambios de materia requieren asignación | Editar clase |
| `GET /topics`, `GET /topics/{id}/exercises` | Sin cambios en los permisos existentes | Catálogo y cantidad de ejercicios |
| `POST /topics` | Tutor autenticado, perfil activo y materia asignada | Crear tema |
| `PATCH /topics/{id}` | Tutor autenticado, perfil activo y materia del tema asignada | Editar nombre, descripción u orden; materia no modificable |
| `GET /messages/contacts` | Estudiante/tutor autenticado; devuelve solo interlocutores con mensajes previos | Resolver nombres de conversación |

### Contratos de escritura

- `POST /classes` body real `ClassCreate`: `tutor_id` (`tutors.id`), `subject_id`, `title` (1–100), `description?`, `date_time` (ISO datetime), `duration_minutes` (>0), `price` (>=0), `status` enum existente. La UI envía estado omitido para usar `scheduled`. Respuesta 201 `ClassResponse`: `id`, `tutor_id`, `subject_id`, `title`, `description`, `date_time`, `duration_minutes`, `price`, `status`, `created_at`.
- `PATCH /classes/{id}` envía los campos editables de la clase salvo `tutor_id` y `status`; respuesta `ClassResponse`. No se ofrece borrado ni cambios de estado en UI. El backend devuelve 403 para propietario no autorizado/materia no asignada y 409 para clase propia no programada.
- `POST /topics` body: `{subject_id, name, description, order_number}`; respuesta 201 `TopicResponse` (`id`, `subject_id`, `name`, `description`, `order_number`, `is_active`).
- `PATCH /topics/{id}` body: `{name?, description?, order_number?}`. `subject_id` y campos extra se rechazan con 422. Tema ausente: 404; tutor sin asignación: 403; nombre duplicado normalizado: 409; payload inválido: 422.
- Para directorio de contactos añadido previamente: `GET /messages/contacts` → `[{user_id, name}]`; excluye correo y usuarios sin conversación con la cuenta autenticada.

## Cambios de frontend

- [TutorPage.jsx](./src/pages/Tutor/TutorPage.jsx): formularios de clases y clases propias.
- [TutorTopicsManager.jsx](./src/pages/Tutor/TutorTopicsManager.jsx): catálogo por materia, búsqueda, formularios de temas, confirmación de edición compartida y conteo de preguntas en solo lectura.
- [TutorPage.css](./src/pages/Tutor/TutorPage.css): estilos de formularios, alertas, lista y responsive.
- [tutor.api.js](./src/api/tutor.api.js): wrappers de crear/editar clase.
- [topics.api.js](./src/api/topics.api.js): wrappers create/update y consulta de ejercicios.
- [MessagesPage.jsx](./src/pages/Messages/MessagesPage.jsx): ya comparte mensajería por rol.
- [ENTREGA_3_REPORTE.md](./ENTREGA_3_REPORTE.md): este reporte consolidado y actualizado.

## Cambios de backend

- [classes.py](../Back/tutorias-backend-completo/app/routers/classes.py): valida materia asignada al crear clase y al cambiar materia en clase propia; limita edición de clases propias a estado `scheduled`; conserva permisos admin y verificación de propiedad.
- [class_schema.py](../Back/tutorias-backend-completo/app/schemas/class_schema.py): valida título no vacío y longitud máxima del campo existente (100).
- [topics.py](../Back/tutorias-backend-completo/app/routers/topics.py): añade POST/PATCH con tutor activo, asignación de materia, nombre duplicado normalizado y transacciones protegidas.
- [topic.py](../Back/tutorias-backend-completo/app/schemas/topic.py): schemas separados de create/update; validación y rechazo de campos extra.
- No se modificaron tablas ni se crearon migraciones. No se halló infraestructura de auditoría para cambios de temas. La prevención de duplicado no es atómica ante carreras concurrentes: no existe índice único compatible y no se añadió migración; sigue siendo un riesgo documentado.

## Pruebas ejecutadas

- `npm run build`: **PASS**, Vite compiló 64 módulos.
- `.venv/bin/python -m compileall -q app`: **PASS**.
- Validación Pydantic positiva y negativa de `ClassCreate`, `TopicCreate` y `TopicUpdate`; import de `app.main` y OpenAPI con POST/PATCH de temas y clases: **PASS**.
- No hay archivos existentes de tests `*test*.py`, `*.test.js` o `*.spec.js` en los proyectos inspeccionados.
- No se ejecutó TestClient/HTTP con DB o credenciales ni se crearon/editaron registros reales. Por tanto, las pruebas de permisos y flujos reales siguen pendientes.

## Matriz de aceptación

| ID | Estado | Evidencia |
|---|---|---|
| T3-01 | NO EJECUTADO | Requiere login de tutor |
| T3-02 | PASS | Panel implementa tarjetas, no `<pre>` |
| T3-03 | PASS | Renderiza valores `0` por comprobación nullish |
| T3-04 | NO EJECUTADO | Requiere datos reales |
| T3-05 | PASS | Estado vacío en lista de materias |
| T3-06 | NO EJECUTADO | Requiere backend con clases |
| T3-07 | NO EJECUTADO | Requiere clase con inscritos |
| T3-08 | PASS | Estado vacío implementado |
| T3-09 | NO EJECUTADO | Manejo implementado; falta prueba HTTP |
| T3-10 | NO EJECUTADO | Requiere cuentas de tutor/estudiante |
| T3-11 | NO EJECUTADO | Requiere historial real |
| T3-12 | NO EJECUTADO | Filtrado por par implementado; falta prueba de red |
| T3-13 | NO EJECUTADO | UI lista solo estudiantes |
| T3-14 | NO EJECUTADO | Requiere cuenta estudiante |
| T3-15 | NO EJECUTADO | Requiere navegador |
| T3-16 | NO EJECUTADO | Requiere cuenta de prueba |
| T3-17 | NO EJECUTADO | Protección existente no probada en navegador |
| T3-18 | NO EJECUTADO | Protección existente no probada en navegador |
| T3-19 | NO EJECUTADO | Requiere sesión expirada real |
| T3-20 | NO EJECUTADO | Build sí; interacción móvil/teclado no probada |
| T3-21 | PASS | La UI no muestra progreso individual inexistente |
| RG3-01 | PASS | `npm run build` exitoso |
| RG3-02 | PASS | `compileall` exitoso |
| RG3-03 | NO EJECUTADO | Requiere sesión admin/estudiante |
| RG3-04 | NO EJECUTADO | Requiere navegador y API |
| RG3-05 | NO EJECUTADO | Requiere navegador y cuenta de prueba |
| RG3-06 | NO EJECUTADO | No hubo pruebas Bruno/HTTP |
| C2-01 | NO EJECUTADO | Crear clase con tutor de prueba |
| C2-02 | NO EJECUTADO | Editar clase propia programada |
| C2-03 | NO EJECUTADO | Denegar clase ajena |
| C2-04 | NO EJECUTADO | Denegar materia no asignada |
| C2-05 | NO EJECUTADO | Validar datos incorrectos vía HTTP |
| C3-01 | NO EJECUTADO | Crear tema por tutor asignado |
| C3-02 | NO EJECUTADO | Editar tema y confirmar advertencia |
| C3-03 | NO EJECUTADO | Denegar tutor no asignado/estudiante |
| C3-04 | NO EJECUTADO | 409 de título duplicado sin prueba HTTP |
| C3-05 | NO EJECUTADO | Confirmar GET topics/adaptive en navegador |

## Riesgos y pendientes

- Los temas son compartidos; sin auditoría disponible no se registra autor ni fecha de edición.
- Verificación de duplicados de tema consulta primero y no es completamente segura frente a dos creaciones concurrentes.
- `GET /topics/{id}/exercises` devuelve statement y opciones (no expone opción correcta en el schema). Se usa en la interfaz únicamente para mostrar el conteo.
- El endpoint de clases permite cambios de estado validados por enum; el formulario no ofrece cambios de estado. No se ofrece edición frontend de clases no programadas.
- La lista de tutores puede comunicarse con cualquier alumno activo por backend; la UI del tutor solo ofrece alumnos de sus clases o contactos con conversación existente.
- No se avanzó a Entrega 4 ni 5.

## Validación manual sugerida

1. Iniciar FastAPI y Vite con base local y cuenta de tutor de prueba.
2. Desde `/tutor`, crear una clase con una materia asignada; confirmar que aparece y que el resumen refresca. Intentar con una materia ajena desde Bruno y confirmar 403.
3. Editar una clase propia programada. Intentar clase ajena (403) y no programada (409) desde Bruno.
4. En «Temas de mis materias», crear tema, buscarlo, consultar cantidad de preguntas y editarlo tras marcar confirmación compartida. Probar título duplicado (409), materia ajena (403), estudiante (403) y payload inválido (422).
5. Confirmar que `/topics` y la práctica adaptativa siguen cargando.
6. Usar cuentas de estudiante/admin para comprobar navegación y Entregas 1–2. No usar datos de producción.

## Ampliación: gestión de preguntas y rediseño del panel

- Backend (`routers/topics.py`, `schemas/exercise.py`), solo rol tutor con materia asignada:
  - `GET /topics/{id}/exercises/manage`: lista preguntas activas con opción correcta.
  - `POST /topics/{id}/exercises`: crea pregunta (2–6 opciones, una correcta, sin opciones repetidas); 409 si el enunciado normalizado ya existe en el tema.
  - `DELETE /topics/{id}/exercises/{exercise_id}`: eliminación lógica (`is_active=false`) para conservar intentos y progreso. Responde 204.
- Frontend: `TutorQuestionsPanel.jsx` (lista, búsqueda, aviso de duplicado, alta y eliminación con confirmación); panel del tutor dividido en pestañas Resumen / Clases / Temas y preguntas.
- Verificación: `npm run build` PASS; `compileall` PASS. Pruebas HTTP/BD/navegador: NO EJECUTADO. Reiniciar uvicorn.
- Nota: no se pueden editar preguntas, y las preguntas son contenido compartido por materia.
