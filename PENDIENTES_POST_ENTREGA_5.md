# Pendientes post Entrega 5

## Alta
1. Validar en navegador los flujos por rol (nada de esto se ejecutó): login, práctica, mensajes, panel tutor, admin, sugerencias. *Sin probar.*
2. Pruebas HTTP end-to-end: instalar `httpx` compatible para usar `TestClient` y cubrir 401/403/404/409/429. *Sin probar.*
3. Correo en producción: verificar Brevo/SMTP desde Render (IP autorizada); evaluar API HTTPS. *Sin probar / riesgo conocido.*

## Media
4. Convertir `requirements.txt` de UTF-16 a UTF-8 y añadir `pytest` (dev). *Defecto menor.*
5. Fijar versiones de dependencias del frontend (hoy `latest`). *Riesgo.*
6. Límite de intentos de login (fuerza bruta) y rate limit general. *Defecto/mejora.*
7. Crear `ENTREGA_1_REPORTE.md` (falta). *Documentación.*
8. 2 estudiantes sin `student_profiles`: revisar si `GET /users/me` y progreso se comportan bien (grado nulo). *Dato.*

## Baja
9. Unificar `/topics/{id}/exercises/*` y `/content/*` si se desea una sola API de gestión.
10. Añadir scripts `lint` y `test` al frontend.
11. Mover tests de lógica de Entrega 4 (SQLite) a `tests/` como suite persistente.
12. IA local: fuera de alcance, no iniciada.
