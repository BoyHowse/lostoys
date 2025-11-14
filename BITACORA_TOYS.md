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
