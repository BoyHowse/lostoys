# LosToys — Estado Actual

## Arquitectura General
- **Backend**: Django 5 + Django REST Framework. Apps principales: `accounts`, `cars`, `alerts`. Configuración central en `backend/config` y entorno en `.env` (usa `FRONTEND_URL`, credenciales SMTP y claves OpenAI).
- **Frontend**: Next.js 15 (React 19) con TailwindCSS. El árbol principal vive en `frontend/src/app` con rutas para dashboard, vehículos, verificaciones y formularios. Contextos compartidos: `AuthContext`, `I18nContext`.
- **Infraestructura**: Proyecto pensado para despliegue tradicional (Gunicorn/Nginx). Actualmente usa SQLite por defecto y correo SMTP (Gmail). Integración con OpenAI para lectura inteligente de documentos.

## Modelos Relevantes
### Accounts
- `User`: Extiende `AbstractUser`. Campos extra: `role`, `phone_number`, flags de recepción de alertas, `country`, `verification_token`, `is_verified`, `verification_sent_at`. Utilizado para flujos de verificación por correo y control de país (Colombia vs. otros).

### Cars y Documentos
- `Car`: Pertenece a un `User`, controla datos base (marca, modelo, placa, año, valor, estado) y calcula `health_status` según documentos asociados.
- `Document`: Pertenece a un `Car`. Tipos soportados: SOAT, Tecnomecánica, Insurance, Registration y **Licencia de Tránsito** (`transit_license`). Campos AI: `ai_status`, `ai_feedback`, `ai_payload`, `ai_checked_at`. Archivos almacenados en `cars/documents/` (se permite imagen o PDF).
- `Credit` y `Maintenance`: Relacionados a `Car` para finanzas y bitácora de talleres.

## Flujos Clave
### Verificación de Cuenta
1. **Registro (`POST /api/accounts/register/`)**: crea usuario, marca `is_verified=False`, genera `verification_token` y `verification_sent_at`, guarda `pending_verification_user_id` en sesión y envía correo HTML mediante `_send_verification_email` con URL `FRONTEND_URL/verify/<token>/`.
2. **Login (`POST /api/accounts/login/`)**: Bloquea acceso si `is_verified` es falso.
3. **Verificación (`GET /api/accounts/verify/<token>/`)**: valida token, revisa expiración de 24h (`timezone.now() - verification_sent_at`). Marca usuario como verificado y genera nuevo token para revocar enlaces previos.
4. **Reenvío (`POST /api/accounts/email/verify/resend/`)**: requiere sesión pendiente; re-genera token y vuelve a enviar.

### Analítica AI de Documentos
- `DocumentViewSet` (DRF) acepta uploads multi-part. Si el usuario es de Colombia y el documento es `transit_license`, se encola `_maybe_enqueue_ai`.
- Servicio `DocumentAIService` (`backend/cars/services.py`) convierte PDFs usando **pypdfium2** (primer página a PNG) y otros archivos se leen directo. El archivo (máx 8MB) se codifica en base64 y se envía al endpoint de OpenAI (`OPENAI_MODEL`, por defecto `gpt-4o-mini`).
- La respuesta debe ser JSON; si la IA no reconoce “Licencia” o marca `readable=false`, el documento queda en `WARNING` con feedback visible en UI. Si es exitoso, `ai_status=COMPLETED`.

### Frontend
- **Dashboard (`src/app/page.tsx`)**: tarjetas de estado y resumen por vehículo, con fondo hero personalizado.
- **Detalle de vehículos (`src/app/cars/[id]/page.tsx`)**: tabs (Documentos, Créditos, Mantenimientos, Notificaciones, Historial). Documentos muestran badges de IA, enlace al archivo, advertencias y botones para agregar.
- **Carga de documentos (`src/app/cars/[id]/documents/new/page.tsx`)**: UI minimalista centrada en cargar imagen/PDF (máx 8MB). Los campos de detalle se muestran sólo después de elegir archivo o al pulsar “Detalles”. Usa `postForm` (nuevo helper en `fetcher.js`).
- **Verificación (`src/app/verify/[token]/page.tsx`)**: Estado success/invalid/expired con toasts y opción de reenvío.
- **Registro/Login**: `AuthContext` evita almacenar usuarios sin verificar y muestra mensajes post-registro.

## Endpoints Principales (Backend)
- `/api/accounts/login|logout|register|me/`
- `/api/accounts/email/verify/resend/`
- `/api/accounts/verify/<uuid:token>/`
- `/api/cars/` (CRUD para vehículos)
- `/api/documents/` (carga multi-part + AI)
- `/api/credits/`, `/api/maintenances/`
- `/api/notifications/` (alertas programadas)
- `/api/accounts/email/test/` (diagnóstico SMTP)

## Dependencias Destacadas
- Django 5, DRF 3.15, django-cors-headers
- Celery (configurado, aún sin worker activo), Twilio SDK para SMS/WhatsApp
- OpenAI SDK `openai==1.40.2` + `pypdfium2` para PDF->PNG
- Pillow para manejo de imágenes
- Frontend: Next.js 15, React 19, TailwindCSS, TypeScript

## Estructura de Carpetas
```
backend/
  accounts/ (modelos, vistas de auth/verificación, utils/email)
  cars/ (modelos, serializers, viewsets, servicios AI)
  alerts/ (lógica de notificaciones)
  config/ (settings, urls, celery)
frontend/
  src/app/ (dashboard, vehículos, verificación, formularios)
  src/context/ (Auth, I18n)
  src/lib/ (fetcher con postForm, traducciones)
logs/
  bitacora.md (legado) + nuevos archivos de savegame
scripts/
  savegametoys.sh
```

## TODO / Roadmap
- [ ] Conectar Celery + un broker real (Redis) para procesar en background el servicio AI en lugar de threads.
- [ ] Implementar vistas frontend para créditos y mantenimientos (actualmente placeholders).
- [ ] Añadir validación UI para retroalimentación en tiempo real tras el análisis AI (polling o WebSocket).
- [ ] Configurar almacenamiento S3/Cloud para documentos en lugar del filesystem local.
- [ ] Añadir pruebas automatizadas (Pytest/Django y Playwright) para cubrir flujos críticos (registro, verificación, carga de licencia).

## Decisiones Técnicas Recientes
- El correo de verificación usa `FRONTEND_URL` flexible para funcionar en local (`localhost:3000`) y en producción futura.
- El análisis de Licencia depende de OpenAI con prompt JSON estricto para asegurar parsing; las respuestas no-JSON disparan un `FAILED` con mensaje en bitácora AI.
- Se aceptan archivos PDF convirtiendo sólo la primera página para reducir tamaño; se limita a 8MB para evitar timeouts y costos.
- El formulario de documentos oculta campos avanzados hasta que se provee el archivo, manteniendo la UI mínima y obligando a adjuntar evidencia visual antes de ingresar datos manuales.

## Notas Importantes
- No incluir credenciales reales en repositorio; las claves SMTP/OpenAI deben ir en `.env`.
- `savegametoys.sh` asume rama `main`; usa `SAVEGAMETOYS_BRANCH` si trabajas en otro branch.
- `tree_toys.txt` y `BITACORA_TOYS.md` se regeneran en cada savegame para mantener rastro completo.
