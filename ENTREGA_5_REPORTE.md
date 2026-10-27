# Entrega 5 — Integración, seguridad y preparación de despliegue

**Estado final: LISTO PARA VALIDACIÓN** (no "listo para producción"). No se desplegó, no se hizo push ni se escribió en Supabase.

## Resumen
Auditoría y estabilización de las Entregas 1–4. Cambios mínimos: CORS configurable, pruebas focalizadas y documentación de despliegue.

## Auditoría (hallazgos)
| Área | Resultado |
|---|---|
| Rutas protegidas por rol (front) | `ProtectedRoute` con `roles`; redirige según rol. OK |
| Sesión expirada | `apiRequest` limpia sesión y emite `nexo-session-expired` en 401 autenticado. OK |
| URL de API | `VITE_API_URL` (por defecto `http://127.0.0.1:8000`); sin `localhost` fijo en `src/` |
| `is_correct` en práctica | No existe en `ExerciseResponse`/`ExerciseOptionResponse`/adaptativo; solo en respuesta de intento y endpoints de gestión (tutor/admin). Test automático |
| Mensajes | Solo estudiante↔tutor; listados filtrados por emisor/receptor; contactos limitados a conversaciones existentes |
| Usuarios | `GET /users` solo admin; `/users/{id}` solo propio o admin |
| Contenido/Admin/Sugerencias | Todas con dependencia de autenticación/rol (test automático) |
| Rutas duplicadas método+path | Ninguna (test). `/topics/{id}/exercises/*` (E3) y `/content/*` (E4) se solapan en función; se mantienen ambas por compatibilidad |
| Secretos | Escaneo de patrones (tokens SMTP/JWT/URLs con credenciales) en archivos versionados y `src/`: sin coincidencias. `.env` en `.gitignore` en ambos proyectos; solo `.env.example` versionado |
| Migración `suggestions` | Aplicada por el usuario; verificada con consultas de solo lectura (tabla existe, 0 filas) |
| `requirements.txt` | Codificado en UTF-16 (pip lo lee, pero conviene UTF-8). Sin pytest declarado |
| Datos | 2 estudiantes sin `student_profiles` (dato, no defecto de código) |
| Entrega 1 | **No existe `ENTREGA_1_REPORTE.md`** |

## Archivos modificados
- Backend: `app/main.py` (CORS desde `CORS_ORIGINS`), `.env.example` (+`CORS_ORIGINS`), `tests/__init__.py`, `tests/test_entrega5.py` (nuevos).
- Documentación: este reporte, `DESPLIEGUE_CHECKLIST.md`, `PENDIENTES_POST_ENTREGA_5.md`.

## Cambios de contrato
Ninguno en endpoints. Nueva variable de entorno opcional `CORS_ORIGINS` (lista separada por comas; por defecto `http://localhost:5173`).

## Defectos corregidos
1. CORS fijo a localhost → configurable (bloqueaba el frontend desplegado).

## Comandos y resultados
| Comando | Resultado |
|---|---|
| `.venv/bin/python -m pytest tests -q` | PASS (7 passed) |
| `.venv/bin/python -m compileall -q app tests` | PASS |
| `.venv/bin/python -c "import app.main"` | PASS |
| `npm run build` | PASS |

## Matriz INT (resumen por evidencia)
| Grupo | Estado | Evidencia |
|---|---|---|
| Sin fuga de `is_correct` en práctica | PASS | test automático de esquemas |
| 4 opciones / 1 correcta / sin duplicadas | PASS | tests de `ExerciseCreate` |
| Sin rutas duplicadas | PASS | test |
| Rutas sensibles con dependencia de auth | PASS (estructural) | test |
| CORS configurable | PASS | test |
| Permisos tutor/admin, duplicado 409, historial, nueva versión, 409 al retirar materia, límite 429 sugerencias | PASS (nivel función, SQLite en memoria, Entrega 4) | ejecutado en sesión previa; no incluido como test persistente |
| Pruebas HTTP end-to-end (TestClient) | BLOQUEADO | falta `httpx2` en el entorno |
| Pruebas en navegador (flujos por rol, doble envío, responsive) | NO EJECUTADO | requieren validación humana |
| Escrituras contra Postgres/Supabase | NO EJECUTADO | prohibido por restricciones |
| Envío real de correos (Brevo/SMTP) | NO EJECUTADO | requiere credenciales y IP autorizada |
| Despliegue Render/frontend | NO EJECUTADO | fuera de alcance |

## Limitaciones y riesgos
- SMTP de Brevo puede fallar por IP no autorizada en Render; se recomienda migrar a API HTTPS en una entrega aparte.
- Arranque en frío de Render: primeras peticiones lentas.
- Dependencias del frontend con versión `latest`; fijar antes de producción.
- Sin rate limit global ni protección de login por fuerza bruta (ver pendientes).
