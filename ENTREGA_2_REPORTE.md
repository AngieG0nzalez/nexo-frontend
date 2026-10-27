# Entrega 2 — Reporte

## Resumen funcional
- **Progreso**: nombre real del tema, materia, grado, nivel, intentos, aciertos, dominio, última práctica, precisión global (solo si hay intentos), temas sin practicar y sugerencia de siguiente tema. Temas ausentes del catálogo muestran «Tema no disponible»; temas de otros grados se ocultan.
- **Temas/práctica**: `/exercise` sin parámetro ofrece selector materia → tema; con `?topic_id=` se valida contra el catálogo del grado (sin petición si es inválido). Botones «Otro ejercicio de este tema» (endpoint adaptativo existente) y «Siguiente tema» (orden de la materia). Tiempo de respuesta medido con `performance.now()` (0–86400 s). El progreso se recarga tras cada intento.
- **Mensajería**: ruta `/messages` (solo `student`), selector de tutor por nombre, historial filtrado por par de usuarios, envío con `users.id`.

## Archivos
Creados (frontend): `src/api/messages.api.js`, `src/hooks/useCatalog.js`, `src/utils/learning.js`, `src/pages/Messages/MessagesPage.jsx/.css`.
Modificados (frontend): `ProgressPage.jsx/.css`, `ExercisePage.jsx/.css`, `TopicsPage.jsx`, `Sidebar.jsx`, `AppRoutes.jsx`.
Modificados (backend): `app/routers/tutors.py`, `app/schemas/tutor.py`.

## Contratos / endpoint nuevo
`GET /tutors` es público y no trae nombres; `/users` es solo admin. Se añadió:

`GET /tutors/directory` — Bearer, roles `student` y `tutor` (otros: 403). Respuesta `[{ user_id, name, specialty }]` solo de tutores y usuarios activos. No expone correo ni `tutors.id`. Declarado antes de `/{tutor_id}`. Sin cambios de base de datos.

## Regla de siguiente tema
1. Sin práctica: primer tema de la primera materia por `order_number`.
2. Con práctica: el siguiente por orden (misma materia) al tema practicado más recientemente, si no está practicado.
3. Si no existe: primer tema sin practicar. Si no hay: «Continuar explorando temas».
Sin umbral de dominio. Tras un intento, «Siguiente tema» = siguiente por orden en la materia.

## Pruebas
- `npm run build`: **exitoso** (RG-01 PASS).
- `python -m compileall -q app` y `import app.main`: sin errores (arranque de la app OK).
- Resto de casos ST-01…ST-21, RG-02…RG-06: **NO EJECUTADO** (requieren navegador, backend con base de datos y cuentas de prueba). Pruebas HTTP de permisos del directorio no ejecutadas (falta `httpx2` para TestClient).

## Pendientes y riesgos
- El backend permite escribir a cualquier tutor activo, sin matrícula; la UI no afirma lo contrario.
- No existe endpoint para marcar mensajes como leídos; no se muestra.
- `ExerciseCard.jsx` (maqueta estática) no se usa y no se tocó.
- No se avanzó a la Entrega 3.

## Validación manual
Backend: `source .venv/bin/activate && python -m uvicorn app.main:app --reload`. Frontend: `npm run dev`. Con estudiante de grado 9/10/11: revisar `/progress`, `/topics`, `/exercise` (con y sin `topic_id`), responder un ejercicio, y `/messages` (enviar a un tutor y cambiar de tutor).
