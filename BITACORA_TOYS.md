## [2025-11-13 23:42] — Documentación SaveGame + soporte PDF en AI
- Cambios:
  - backend/cars/services.py actualizado
  - backend/cars/serializers.py actualizado
  - backend/requirements.txt actualizado
  - savegametoys.md reescrito
  - BITACORA_TOYS.md actualizado
  - tree_toys.txt regenerado
- Descripción técnica
  - DocumentAIService ahora acepta imágenes o PDF convirtiendo la primera página a PNG usando pypdfium2, preservando el límite de 8MB y manteniendo la lógica de estados AI.
  - La validación de DRF permite archivos PDF además de imágenes; se agregó dependencia pypdfium2 al backend.
  - Se documentó el estado completo del proyecto en savegametoys.md y se registró este savegame en la bitácora.
- Pruebas necesarias
  - Subir una Licencia de Tránsito en PDF y verificar que aparezca con estado AI correspondiente.
  - Ejecutar `savegametoys "mensaje"` para confirmar que automation registra tree y bitácora.
- Pendientes futuros
  - Integrar Celery/Redis para el pipeline AI.
  - Implementar UI/alerts para resultados AI en tiempo real.

## [2025-11-14 00:02] — Setup comando savegametoys automatizado
- Cambios:
  - savegametoys creado/actualizado
  - scripts/generate_savegametoys.ts creado
  - savegametoys.md regenerado con plantilla de comando
  - tree_toys.txt regenerado
- Descripción técnica
  - Se añadió un script root sin extensión que orquesta regeneración del savegame (vía `npx tsx`), bitácora incremental, snapshot del árbol y commit/push automático.
  - Se creó `scripts/generate_savegametoys.ts` que reescribe `savegametoys.md` con la plantilla base; el comando lo invoca mediante `npx tsx`.
  - Se volvió a ejecutar la plantilla inicial para garantizar consistencia y se actualizó el snapshot del árbol del repo.
- Pruebas necesarias
  - Ejecutar `./savegametoys "mensaje"` y verificar que regenere savegame, bitácora y realice push sin errores.
- Pendientes futuros
  - Reemplazar el placeholder de la plantilla con generación dinámica del contenido real.

## [2025-11-14 00:19] — SaveGame Update automático
- Cambios:
  - BITACORA_TOYS.md modificado por el flujo automático
- Descripción técnica
  - Registro automático generado por el script anterior (sin cambios adicionales en código).
- Pruebas necesarias
  - Ninguna (entrada informativa).
- Pendientes futuros
  - Sustituir estos registros automáticos por documentación detallada.

## [2025-11-14 00:25] — SaveGame Update automático
- Cambios:
  - BITACORA_TOYS.md modificado por el flujo automático
- Descripción técnica
  - Registro automático generado por el script anterior (sin cambios adicionales en código).
- Pruebas necesarias
  - Ninguna.
- Pendientes futuros
  - Consolidar entradas automáticas en descripciones más completas.

## [2025-11-14 00:34] — Reinstalación de entorno backend y documentación SaveGame
- Cambios:
  - backend/venv recreado e instalado con `pip install -r requirements.txt`
  - savegametoys.md reescrito con el estado actual
  - tree_toys.txt regenerado tras la reinstalación
- Descripción técnica
  - Se recreó el entorno virtual (`python3 -m venv backend/venv`) y se reinstalaron dependencias para restaurar los templates internos de Django que provocaban el error `technical_500.html`.
  - Se documentó el procedimiento dentro de savegametoys.md para futuras referencias.
- Pruebas necesarias
  - Levantar el servidor (manage.py runserver) y verificar que `/api/accounts/me/` responde sin error 500.
- Pendientes futuros
  - Automatizar validaciones del entorno antes de arrancar el backend.

## [$(date '+%Y-%m-%d %H:%M')] — Ajuste verify/[token] y documentación SaveGame
- Cambios:
  - frontend/src/app/verify/[token]/page.tsx actualizado para usar useParams
  - savegametoys.md actualizado con nota sobre el flujo de verificación
  - tree_toys.txt regenerado
- Descripción técnica
  - Next.js 15 vuelve `params` una Promise en componentes cliente; se reemplazó la desestructuración directa por `useParams` para evitar errores y preparar la migración obligatoria.
  - Se dejó constancia del cambio en savegametoys.md dentro de la sección de notas.
- Pruebas necesarias
  - Abrir un enlace de verificación (`/verify/<token>/`) y confirmar que ya no aparece el warning/console error.
- Pendientes futuros
  - Evaluar un refactor para extraer lógica común de verificación/reestreno de correos.

## [$(date '+%Y-%m-%d %H:%M')] — Login sin CSRF para clientes externos
- Cambios:
  - backend/accounts/views.py marcado como csrf_exempt en SessionLoginView
  - savegametoys.md actualizado con la nota correspondiente
  - tree_toys.txt regenerado
- Descripción técnica
  - Al no incluir token CSRF, los POST provenientes de Postman o apps nativas retornaban 403; se aplicó `@csrf_exempt` sobre la vista de login manteniendo el resto de endpoints protegidos.
  - Se documentó el cambio en el SaveGame para futuras referencias.
- Pruebas necesarias
  - Realizar `POST /api/accounts/login/` sin CSRF (desde Postman) con credenciales válidas y verificar respuesta 200 + cookie de sesión.
- Pendientes futuros
  - Evaluar JWT o autenticación alternativa para clientes móviles.

## [$(date '+%Y-%m-%d %H:%M')] — CsrfExemptSessionAuthentication para login
- Cambios:
  - backend/accounts/authentication.py creado con variante CsrfExemptSessionAuthentication
  - backend/accounts/views.py usando la nueva clase y manteniendo @csrf_exempt
  - savegametoys.md actualizado
  - tree_toys.txt regenerado
- Descripción técnica
  - Django seguía aplicando verificación CSRF a pesar del decorador porque el `SessionAuthentication` por defecto la fuerza; se creó una variante que omite `enforce_csrf` y se asignó al login para permitir pruebas desde Postman/apps móviles.
- Pruebas necesarias
  - POST /api/accounts/login/ desde Postman sin token CSRF debe responder 200 con credenciales válidas.
- Pendientes futuros
  - Evaluar mover login a JWT para evitar sesiones cuando el cliente sea 100% mobile.

## [$(date '+%Y-%m-%d %H:%M')] — Seed inicial marca usuarios como verificados
- Cambios:
  - backend/accounts/management/commands/seed_initial_data.py asegura `boy` y `demo` con `is_verified=True`
  - savegametoys.md actualizado
  - tree_toys.txt regenerado
- Descripción técnica
  - Los usuarios de demo quedaban con `is_verified=False`, provocando 403 al hacer login. El seed ahora setea `is_verified`, `verification_sent_at` y `country` para ambos usuarios y se ejecutó nuevamente el comando.
- Pruebas necesarias
  - Correr `python manage.py seed_initial_data` y luego iniciar sesión con `boy/Prestige1$` o `demo/demo1234`.
- Pendientes futuros
  - Añadir indicadores en el panel admin para saber qué usuarios están verificados.

## [$(date '+%Y-%m-%d %H:%M')] — Migración local a PostgreSQL
- Cambios:
  - backend/.env (local) apuntando a lostoys_dev en Postgres
  - backend/.env.example documenta USE_SQLITE
  - savegametoys.md actualizado con la nueva configuración
  - tree_toys.txt regenerado
- Descripción técnica
  - Se creó la BD `lostoys_dev` y el usuario `lostoys_user`; Django quedó configurado con `USE_SQLITE=false` y credenciales Postgres, luego se ejecutaron `python manage.py migrate` y `seed_initial_data` para poblarla.
- Pruebas necesarias
  - `python manage.py runserver` y verificar `/api/accounts/login/` y `/api/accounts/me/` apuntando a la nueva DB.
- Pendientes futuros
  - Considerar scripts para crear la DB automáticamente (Makefile o management command).

## [$(date '+%Y-%m-%d %H:%M')] — Fix health_status en Car
- Cambios:
  - backend/cars/models.py invoca doc.days_until_expiry()
  - savegametoys.md actualizado
  - tree_toys.txt regenerado
- Descripción técnica
  - El método `health_status` usaba el método `days_until_expiry` sin llamarlo, provocando `TypeError: '<' not supported between instances of 'method' and 'int'` en `/api/cars/<id>/`. Ahora se llama al método y la API vuelve a responder 200.
- Pruebas necesarias
  - GET `/api/cars/` y `/api/cars/<id>/` (en especial el vehículo recién creado con AI) para confirmar que el health_status se calcula correctamente.
- Pendientes futuros
  - Agregar tests unitarios que cubran `Car.health_status` y flujos de documentos AI.

## [$(date '+%Y-%m-%d %H:%M')] — Licencia de tránsito: metadata + UI
- Cambios:
  - backend/cars/models.py agrega campos `license_metadata`, `is_license_valid`, `license_validation_message`
  - backend/cars/services.py llena esos campos, actualiza fechas y mensajes y corrige provider/notas
  - backend/cars/migrations/0003... añade las columnas
  - backend/cars/serializers.py expone los campos en la API
  - frontend/src/app/cars/[id]/page.tsx muestra el chip “VÁLIDO”/mensaje de error y usa `<a>` para ver archivos
  - frontend/src/lib/translations.ts agrega textos para las nuevas etiquetas
  - savegametoys.md documenta el flujo
  - tree_toys.txt regenerado
- Descripción técnica
  - Ahora, al detectar “Licencia de Tránsito”, la IA guarda los campos estructurados (`license_metadata`), ajusta issue/expiry y marca `is_license_valid`. El frontend refleja el estado con mensajes claros y el enlace “Ver archivo” abre correctamente en una pestaña.
- Pruebas necesarias
  - Subir una licencia de tránsito legible y verificar que el documento pase a “VÁLIDO” y las fechas se autocompleten.
- Pendientes futuros
  - Mostrar el detalle de `license_metadata` en un modal o ficha dedicada.
## [2025-11-14 16:35] — IA Licencia estable + SaveGame docs
- Cambios:
  - backend/cars/services.py sanea las respuestas Responses y vuelve a procesar licencias
  - scripts/generate_savegametoys.ts ahora genera un estado completo y con timestamp dinámico
  - savegametoys.md se regeneró con la fotografía actual del proyecto
- Descripción técnica
  - Se actualizó el cliente OpenAI (pip install) y el servicio `DocumentAIService` ahora limpia fences markdown antes de parsear JSON, evitando el error `'OpenAI' object has no attribute 'responses'` y los `JSONDecodeError`. También se documentaron arquitectura, flujos y roadmap en el nuevo generador TS.
- Pruebas necesarias
  - Reprocesar un documento (`DocumentAIService(document_id).run()`) y verificar que el registro pasa a `ai_status=completed` y `license_validation_message="Documento válido"`.
  - Abrir un archivo desde `/cars/:id` y confirmar que `/media/...` lo despliega en el navegador.
- Pendientes futuros
  - Persistir más campos de la licencia (ej. fechas faltantes) y mostrar el visor embebido en el frontend.
## [2025-11-14 16:39] — Tree filtrado y snapshot limpio
- Cambios:
  - savegametoys.md se regeneró (nuevo timestamp)
  - tree_toys.txt se volvió a generar ignorando venv/__pycache__ para reducir ruido
- Descripción técnica
  - Se eliminaron artefactos `__pycache__` y se actualizó el comando de snapshot para excluir entornos locales. El SaveGame queda legible y liviano.
- Pruebas necesarias
  - Ejecutar `tree -I "node_modules|.venv|venv|env|static|__pycache__|*.pyc"` y verificar que `backend/venv` ya no aparece.
- Pendientes futuros
  - Automatizar la limpieza de `__pycache__` dentro del propio comando `savegametoys`.
## [2025-11-14 16:55] — Vista previa de documentos habilitada
- Cambios:
  - backend/config/settings.py define `X_FRAME_OPTIONS = "SAMEORIGIN"`
  - scripts/generate_savegametoys.ts/an savegametoys.md documentan la regla de seguridad
  - tree_toys.txt regenerado
- Descripción técnica
  - Los archivos PDF/imagen servidos desde `/media/` eran bloqueados por Chrome (about:blank#blocked) porque Django enviaba `X-Frame-Options: DENY`. Se relajó a `SAMEORIGIN` para que el visor integrado del navegador pueda abrirlos en una nueva pestaña sin comprometer dominios externos.
- Pruebas necesarias
  - En el dashboard, hacer clic en "Ver archivo" para cualquier documento existente; debe abrirse el PDF/imagen real en una pestaña nueva.
- Pendientes futuros
  - Añadir visor embebido dentro de la app usando un modal (posible cuando cambiemos la cabecera a ALLOW-FROM si se sirve en dominio distinto).
## [2025-11-14 16:58] — Enlaces directos a documentos
- Cambios:
  - frontend/src/app/cars/[id]/page.tsx ahora resuelve URLs absolutas/relativas antes de renderizar "Ver archivo"
  - savegametoys.md y tree_toys.txt regenerados
- Descripción técnica
  - DRF ya devuelve `document_file` como URL absoluto; al concatenar `apiBaseUrl` quedaban strings inválidos (`http://localhost:8000http://...`) y Chrome los bloqueaba mostrando `about:blank#blocked`. Se añadió `resolveFileUrl` para detectar `http(s)` y solo prefijar cuando el backend entregue rutas relativas.
- Pruebas necesarias
  - Abrir un vehículo con documentos y hacer clic en "Ver archivo"; el enlace debe apuntar a una URL válida que carga el PDF/imagen real.
- Pendientes futuros
  - Añadir fallback para mostrar mensaje si el archivo no existe (404) y un visor integrado dentro de la app.
## [2025-11-14 17:07] — SaveGame Update
Archivos modificados:
- BITACORA_TOYS.md
- savegametoys.md

## [2025-11-14 17:05] — Panel SOAT + consulta externa
- Cambios:
  - backend/cars/models.py agrega campos `external_*` al modelo Document + migración 0004
  - backend/cars/services.py incorpora `SoatLookupService`, mock dataset y nuevos helpers
  - backend/cars/views.py y urls exponen `/api/cars/<id>/soat/` con refresco
  - frontend/src/app/cars/[id]/page.tsx añade la pestaña SOAT y llamadas GET/POST
  - frontend/src/lib/translations.ts, savegametoys.md, backend/data/mock_soat_dataset.json documentan el flujo
- Descripción técnica
  - Cada documento tipo SOAT dispara `SoatLookupService`, que intenta consultar `SOAT_PROVIDER_URL` (o el mock `backend/data/mock_soat_dataset.json`) y guarda la respuesta en `Document.external_*`. Se añadió el endpoint `/api/cars/:id/soat/` para obtener la última consulta y forzar un refresh. El dashboard suma una pestaña dedicada que muestra estado oficial, coberturas y la información del documento local.
- Pruebas necesarias
  - Crear/actualizar un documento SOAT y verificar que `/api/cars/<id>/soat/` retorna `external` con los datos del mock.
  - Desde el frontend, abrir la pestaña SOAT y pulsar “Actualizar consulta” para confirmar que el estado cambia y se muestra el detalle.
- Pendientes futuros
  - Integrar un proveedor oficial (RUNT/Fasecolda) y agregar manejo de errores específicos o reintentos programados.
## [2025-11-14 17:56] — OCR de licencias con fechas reales
- Cambios:
  - backend/cars/ocr.py nuevo módulo que normaliza fechas (dd/mm/yyyy, guiones, etc.).
  - backend/cars/services.py usa el OCR sobre `raw_text` de OpenAI para poblar `issue_date`/`expiry_date` sin fallbacks.
  - backend/cars/models.py añade la propiedad `is_expired`; serializers/frontend exponen el flag.
  - frontend/src/app/cars/[id]/page.tsx muestra la alerta “DOCUMENTO EXPIRADO”.
- Descripción técnica
  - El LLM devolvía cadenas incompletas y se terminaba guardando `timezone.now()` downstream. Ahora extraemos fechas directamente del texto OCR y sólo guardamos cuando realmente existen, dejando `null` en caso contrario. La UI marca los documentos vencidos en rojo.
- Pruebas necesarias
  - Subir una licencia con fecha vencida y confirmar que `/api/cars/:id/` devuelve `is_expired=true` en el documento.
  - Verificar en el dashboard que aparece la alerta roja en la fila correspondiente.
- Pendientes futuros
  - Añadir más patrones para variaciones de “Fecha de expedición” y soportar múltiples instancias (p. ej. contraseñas).
## [2025-11-14 18:38] — Formato correcto de fechas en documentos
- Cambios:
  - frontend/src/app/cars/[id]/page.tsx usa `toLocaleDateString("es-CO")` para emisión y vencimiento, evitando que aparezcan en formato mm/dd.
- Descripción técnica
  - Se añadió un helper `formatDocumentDate` para mostrar siempre dd/mm/aaaa; antes el navegador usaba la configuración en-US y confundía a los usuarios.
- Pruebas necesarias
  - Abrir un vehículo con licencia cargada y verificar que las columnas muestran fechas legibles (ej. 13/11/2025).
- Pendientes futuros
  - Mostrar la zona horaria del usuario si personalizamos más adelante.
## [2025-11-14 18:57] — Borrado de documentos + manejo de rate limit
- Cambios:
  - backend/cars/services.py captura `openai.RateLimitError` y marca el documento en WARNING con un mensaje legible en lugar de dejarlo colgado en “Procesando”.
  - frontend/src/app/cars/[id]/page.tsx permite eliminar documentos (botón junto a “Ver archivo”), muestra mensajes de error y vuelve a cargar el vehículo; además añade confirmación y estado “Eliminando…”.
  - frontend/src/lib/translations.ts incorpora los textos para eliminar/errores.
  - backend/cars/management/commands/reprocess_licenses.py permite reprocesar licencias desde CLI.
- Descripción técnica
  - Se añadió `delRequest` en el frontend para invocar `DELETE /api/documents/:id/`; tras eliminar, se vuelve a consultar `/api/cars/:id/` para actualizar la tabla. En backend se maneja el límite de OpenAI y se ofrece un comando `python manage.py reprocess_licenses --id <doc>` para volver a correr el OCR.
- Pruebas necesarias
  - Subir un documento, eliminarlo desde el dashboard y comprobar que desaparece sin recargar la página.
  - Simular rate limit (o forzarlo) y verificar que el documento queda marcado en rojo con el mensaje “Servicio de IA temporalmente saturado”.
- Pendientes futuros
  - Exponer en la UI un botón “Reintentar análisis” que invoque internamente el comando/servicio sin pasar por la consola.
## [2025-11-14 19:22] — Retries automáticos contra OpenAI
- Cambios:
  - backend/cars/services.py introduce `_call_openai_with_retry` con backoff configurable (`OPENAI_MAX_RETRIES`, `OPENAI_RETRY_BACKOFF`).
- Descripción técnica
  - Cuando OpenAI responde 429 u otro `APIError`, el servicio reintenta automáticamente con esperas crecientes antes de rendirse; esto evita que los documentos queden fallidos cuando la cuota todavía tiene margen.
- Pruebas necesarias
  - Forzar varios documentos seguidos y observar cómo el log muestra los reintentos antes de marcar WARNING.
- Pendientes futuros
  - Registrar métricas del número de reintentos para ajustar el backoff conforme al plan de uso.
## [2025-11-14 19:48] — Fechas opcionales hasta que la IA las lea
- Cambios:
  - backend/cars/models.py permite `issue_date` y `expiry_date` nulos (migración 0005) y el serializer acepta valores vacíos.
  - frontend/src/app/cars/[id]/documents/new/page.tsx deja los campos de fecha en blanco por defecto, evitando llenar “hoy” automáticamente.
- Descripción técnica
  - Las licencias registradas quedaban con emisión/vencimiento igual al día de carga porque la UI mandaba `new Date()` y el modelo no aceptaba null. Ahora, si el usuario no captura nada, el documento se crea con fechas vacías y el OCR es quien las completa cuando se obtiene el resultado.
- Pruebas necesarias
  - Subir una licencia, verificar que en la DB (o `/api/cars/:id/`) `issue_date`/`expiry_date` quedan `null` hasta que el análisis termine.
- Pendientes futuros
  - Para documentos distintos a la licencia, ofrecer un “autocompletar con hoy” opcional en vez de obligar al usuario a escribir.
## [2025-11-14 19:58] — Manejo de documentos sin fecha
- Cambios:
  - backend/cars/models.py maneja `expiry_date=None` retornando un valor alto en `days_until_expiry` y evitando el error al restar con `None`.
- Descripción técnica
  - Tras permitir fechas nulas, la API fallaba en `status_indicator` porque intentaba restar `None - date`. Ahora, si no hay fecha, se considera un documento "sin vencimiento" y no revienta el serializer.
- Pruebas necesarias
  - Crear un documento sin capturar fecha; el POST debe responder 201 y `/api/cars/:id/` no debe lanzar 500.
- Pendientes futuros
  - Evaluar si conviene mostrar "—" o un badge especial para documentos sin fecha.
## [2025-11-14 20:11] — OCR ahora analiza todas las páginas del PDF
- Cambios:
  - backend/cars/services.py envía todas las páginas de un PDF a OpenAI (no solo la primera). Cada página se convierte a PNG y se añade como `input_image`.
- Descripción técnica
  - Las licencias tienen información de fechas al reverso; antes solo convertíamos la primera página, así que la IA nunca veía las fechas. Al generar una imagen por página y adjuntarlas en la misma solicitud, el modelo ya puede leer los campos "Fecha exp." y "Fecha venc." aunque estén en la segunda cara.
- Pruebas necesarias
  - Subir una licencia PDF de dos páginas y verificar que `raw_text` incluye las secciones de fechas y que el dashboard muestra los valores.
- Pendientes futuros
  - Si el documento es una imagen multipágina (TIFF), evaluar hacer lo mismo.
## [2025-11-14 20:29] — Error por variable local en OCR multi-página
- Cambios:
  - backend/cars/services.py inicializa `user_prompt` antes de construir la lista `contents`, eliminando el `UnboundLocalError` que aparecía tras el cambio multi-página.
- Descripción técnica
  - Al mover `user_prompt` más abajo, `contents` lo usaba antes de definirlo; la IA nunca se ejecutaba y el frontend mostraba “cannot access local variable user_prompt”. Ahora la variable se define junto al prompt del sistema y el flujo vuelve a ejecutar la solicitud correctamente.
- Pruebas necesarias
  - Subir una licencia en PDF y comprobar que ya no sale el error; el documento debe pasar a “Procesando/Válido” y capturar fechas reales.
