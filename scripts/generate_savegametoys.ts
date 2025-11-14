import { writeFileSync } from "fs";

const updatedAt = new Date().toISOString();

const savegame = `# SAVEGAME TOYS

_Actualizado: ${updatedAt}_

## 1. Arquitectura General
- **Backend:** Django 5 + Django REST Framework. Autenticación por sesión, CSRF deshabilitado únicamente en \`SessionLoginView\`. Corre sobre PostgreSQL y lee configuración desde \`backend/.env\`.
- **Frontend:** Next.js 15 (React 19) en modo App Router. UI en español enfocada en panel oscuro con Tailwind 4 y componentes propios.
- **Servicios auxiliares:** Gmail SMTP para notificaciones de verificación, OpenAI (Responses API) para lectura de licencias y el comando \`savegametoys\` para documentación/commits automáticos.

## 2. Modelos Principales
- **accounts.User:** hereda de \`AbstractUser\`; campos extra (role, phone_number, country, verification_token, verification_sent_at, flags de alertas).
- **cars.Car:** vehículo por usuario; calcula \`health_status\` según documentos.
- **cars.Document:** tipos SOAT/Tecnomecánica/Seguro/Registro/Licencia de tránsito. Guarda metadatos del análisis (ai_status, license_metadata, is_license_valid, mensajes).
- **cars.Credit**, **cars.Maintenance** y alertas relacionadas para historial financiero/mantenimiento.

## 3. Flujos Clave
- **Registro:** \`RegisterView\` crea usuario, marca \`is_verified=False\`, genera token, envía email HTML bilingüe y guarda ID en sesión para reenviar.
- **Verificación:** frontend en \`/verify/[token]\` consulta \`/api/accounts/verify/<token>/\`, maneja estados success/invalid/expired y permite reenviar. Tokens expiran a las 24 h y se regeneran después de usarse.
- **Login:** bloqueado cuando \`is_verified=False\`. Usa \`CsrfExemptSessionAuthentication\` para permitir peticiones desde Next sin token manual.
- **Documentos + IA:** al subir “Licencia de tránsito” para usuarios de CO se lanza \`DocumentAIService\` en thread. Convierte PDF → PNG con pypdfium2, llama a OpenAI Responses, valida JSON (limpiando los fences markdown que envía el modelo) y rellena metadatos/notas/mensajes.
- **SOAT:** cuando se registra o actualiza una póliza se ejecuta \`SoatLookupService\`, que consulta \`SOAT_PROVIDER_URL\` (o el mock \`backend/data/mock_soat_dataset.json\`) y guarda el resultado en \`Document.external_*\`. El frontend consume \`/api/cars/:id/soat/\` para mostrar vencimientos y coberturas oficiales.

## 4. Endpoints Destacados
- **Accounts:** \`/api/accounts/register\`, \`/login\`, \`/logout\`, \`/me\`, \`/verify/<uuid>\`, \`/email/verify/send\`, \`/email/verify/resend\`, \`/email/test\`.
- **Cars:** viewsets en \`/api/cars/\`, \`/api/documents/\`, \`/api/credits/\`, \`/api/maintenance/\`.
- **Helpers:** \`/api/csrf/\` para inicializar cookies de sesión desde el frontend.

## 5. Dependencias
- Backend: Django 5, DRF 3.15, django-cors-headers, psycopg 3, Celery (pendiente de uso), Twilio, Pillow, OpenAI 2.8, httpx, pypdfium2.
- Frontend: Next 15.5, React 19.1, Tailwind 4, ESLint 9, TypeScript 5.

## 6. Estructura Relevante
- \`backend/config/settings.py\`: configuración general, correo SMTP, logging INFO, MEDIA_URL servido en debug.
- \`backend/accounts\`: autenticación/verificación.
- \`backend/cars\`: modelos, serializers y servicio de IA (\`services.py\`).
- \`frontend/src/app\`: vistas de dashboard, documentos y flujo de verificación.
- \`scripts/\`: \`savegametoys\` (bash) + generador TS de este archivo.

## 7. TODOs Pendientes
- Migrar el análisis de documentos a Celery o background worker robusto.
- Conectar el lookup de SOAT con una fuente oficial (RUNT/Fasecolda) en lugar del dataset mock.
- Guardar automáticamente fechas de vigencia cuando OpenAI o el proveedor externo las devuelvan vacías (ej. inferencia OCR adicional).
- Añadir interfaz para ver/descargar archivos dentro de un visor embebido.
- Extender la lectura automática a SOAT/Tecnomecánica con IA (actualmente sólo Licencia de tránsito usa OpenAI).

## 8. Decisiones Técnicas
- Priorizar autenticación por sesiones para compartir cookies entre backend y Next (requiere \`credentials: include\` en fetcher).
- Usar PostgreSQL como fuente única (se descartó SQLite/demo). Datos críticos no se borran al reiniciar.
- Los procesos largos (IA de licencias y consulta SOAT) corren en threads apoyados en \`transaction.on_commit\` para no bloquear las vistas principales.
- Documentación y commits controlados con \`./savegametoys\` para mantener bitácora + tree sincronizados.

## 9. Roadmap Corto
1. Exponer visor de archivos y mejorar feedback visual (badge “Documento válido” ya implementado).
2. Dashboard de salud de flota con alertas agregadas.
3. Integración con otros proveedores (SMS/WhatsApp) reutilizando flags de usuario.
4. despliegue staging con dominios reales para enlaces de verificación.

## 10. Notas Importantes
- Las credenciales sensibles (DB, OpenAI, SMTP y proveedor SOAT) viven únicamente en \`backend/.env\`; nunca se imprimen en logs ni en estos documentos.
- Para probar flujos de email usar \`python manage.py runserver\` + \`/api/accounts/email/test/\`.
- Documentos se sirven desde \`/media/\`; frontend construye URLs con \`NEXT_PUBLIC_API_URL\` y la cabecera \`X_FRAME_OPTIONS = \"SAMEORIGIN\"\` permite previsualizarlos sin bloqueos.
- \`SOAT_PROVIDER_URL\`, \`SOAT_PROVIDER_TOKEN\` y \`SOAT_MOCK_DATA_PATH\` controlan la fuente de datos externos; por defecto usamos \`backend/data/mock_soat_dataset.json\`.
- Después de cada cambio correr \`./savegametoys\` para regenerar este archivo, bitácora, snapshot \`tree_toys.txt\` y push automático.
`;

writeFileSync("savegametoys.md", savegame);
