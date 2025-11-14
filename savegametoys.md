# LosToys — Estado Actual (SaveGame)

Este documento se regenera cada vez que corremos el flujo SaveGameToys para dejar trazado el estado real del proyecto.

## 1. Arquitectura
- **Backend**: Django 5 + DRF, apps `accounts`, `cars`, `alerts`. Configuración en `backend/config/settings.py`. Entorno gestionado vía `.env` (no versionado) y `python-dotenv`.
- **Frontend**: Next.js 15 / React 19 con TailwindCSS. Rutas bajo `frontend/src/app`, componentes en `frontend/src/components`, contextos en `frontend/src/context`.
- **Infraestructura prevista**: Gunicorn + Nginx. Actualmente SQLite local. Email SMTP (Gmail). OpenAI para OCR/LLM y Twilio para SMS/WhatsApp (placeholders en `.env`).

## 2. Modelos clave
- `accounts.User`: extiende `AbstractUser`, agrega `role`, `phone_number`, flags de alertas, `country`, `verification_token`, `verification_sent_at` e `is_verified`.
- `cars.Car`: datos base del vehículo y `health_status` derivado de documentos.
- `cars.Document`: tipos (SOAT, Tecnomecánica, Insurance, Registration, Licencia de tránsito). Campos AI: `ai_status`, `ai_feedback`, `ai_payload`, `ai_checked_at`, admite `document_file` imagen o PDF.
- `cars.Credit` / `cars.Maintenance`: información financiera y bitácora de talleres.

## 3. Flujos principales
1. **Registro / Verificación**: `RegisterView` genera token y envía correo mediante `_send_verification_email` usando `FRONTEND_URL`. Login bloquea usuarios sin verificar. `verify_account` valida token de 24h y actualiza flags. `resend_verification_email` permite reenviar.
2. **Documentos + AI**: `DocumentViewSet` acepta multipart; si el usuario es de Colombia y tipo `transit_license`, se encola `enqueue_license_analysis`. `DocumentAIService` convierte PDF (pypdfium2) a PNG, llama OpenAI `gpt-4o-mini` y marca estados `COMPLETED/WARNING/FAILED`.
3. **Frontend**: dashboards (resumen), detalle de vehículos (tabs), formulario minimalista para licencias (campos avanzados ocultos hasta subir archivo), pantalla `/verify/[token]` con estados + reenvío.

## 4. Endpoints destacados
- `/api/accounts/`*: login, logout, register, me, verify, resend, email/test.
- `/api/cars/`, `/api/documents/`, `/api/credits/`, `/api/maintenances/`, `/api/notifications/`.

## 5. Dependencias
- Backend: Django 5, DRF 3.15, celery 5.3, twilio 9, openai 1.40.2, pypdfium2 4.30, Pillow 10.4.
- Frontend: Next.js 15, TailwindCSS, TypeScript, tsx (para scripts).

## 6. Estado de entorno
- 2025-11-14: se recreó `backend/venv` y se reinstalaron dependencias (`pip install -r requirements.txt`) luego de que el entorno anterior fuera eliminado; esto corrige el error `technical_500.html` al servir páginas de error.

## 7. TODO / Roadmap
- Migrar pipeline AI a Celery/Redis en lugar de threads.
- Almacenar archivos en S3 u otro storage remoto.
- UI para créditos/mantenimientos (actualmente placeholders).
- Alertas UI cuando un documento queda en WARNING.
- Suite de pruebas automáticas (Pytest/Playwright).

## 8. Notas
- `savegametoys` script regenera este archivo, la bitácora y el árbol, además de hacer commit/push.
- Sensibles: `.env`, `backend/venv`, `backend/db.sqlite3` ignorados mediante `.gitignore`.
- La vista `/verify/[token]` (Next.js) ahora usa `useParams` para alinearse con el nuevo contrato de `params` basado en Promises, evitando warnings/errores a futuro.
- El endpoint `/api/accounts/login/` se declaró `csrf_exempt` para permitir autenticaciones desde clientes externos (Postman, apps móviles) sin requerir token CSRF, manteniendo la sesión basada en cookies.
- Se añadió una autenticación `CsrfExemptSessionAuthentication` específica para el login, lo que evita 403 por CSRF pero mantiene el resto de endpoints con las protecciones por defecto.
- El comando `seed_initial_data` ahora marca automáticamente a `boy` y `demo` como `is_verified=True` para que las credenciales del README funcionen sin pasar por el flujo de correo.
