from __future__ import annotations

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from cars.models import Document

from .models import Notification
from .tasks import dispatch_notification


def schedule_document_alerts() -> int:
    """
    Reglas solicitadas:
    - APP: siempre crea notificación en el sistema siguiendo las ventanas.
    - Expirado (<0): notificación diaria hasta que se actualice.
    - <=7 días: notificación diaria.
    - <=30 días: notificación cada 7 días.
    - Canales extra (email/sms/whatsapp) solo si el usuario los tiene activos.
    """
    content_type = ContentType.objects.get_for_model(Document)
    alerts_created = 0
    now = timezone.now()
    today = now.date()

    documents = Document.objects.select_related("car__user")
    for document in documents:
        days_until = document.days_until_expiry()
        user = document.car.user

        channels = ["app"]
        channels.extend(_resolve_user_channels(user))

        message = _build_document_message(document, days_until)

        for channel in channels:
            if not _should_send(document, channel, content_type, today, days_until):
                continue
            notification, created = Notification.objects.get_or_create(
                user=user,
                notification_type=channel,
                reference_content_type=content_type,
                reference_object_id=document.id,
                defaults={"message": message, "send_date": now},
            )
            if created:
                alerts_created += 1
                if channel != Notification.NotificationType.APP:
                    dispatch_notification.delay(notification.id)

    return alerts_created


def _resolve_user_channels(user) -> list[str]:
    channels: list[str] = []
    if getattr(user, "receive_email_alerts", False):
        channels.append(Notification.NotificationType.EMAIL)
    if getattr(user, "receive_sms_alerts", False):
        channels.append(Notification.NotificationType.SMS)
    if getattr(user, "receive_whatsapp_alerts", False):
        channels.append(Notification.NotificationType.WHATSAPP)
    return channels


def _build_document_message(document: Document, days_until: int) -> str:
    if days_until < 0:
        status = "EXPIRADO"
    elif days_until == 0:
        status = "VENCE HOY"
    elif days_until <= 7:
        status = f"Vence en {days_until} días"
    elif days_until <= 30:
        status = f"Vence en {days_until} días (alerta temprana)"
    else:
        status = f"Vence en {days_until} días"
    return f"[{document.car.plate}] {document.get_type_display()} · {status} · Proveedor: {document.provider or 'N/A'}."


def _should_send(
    document: Document,
    channel: str,
    content_type: ContentType,
    today,
    days_until: int,
) -> bool:
    qs = Notification.objects.filter(
        user=document.car.user,
        notification_type=channel,
        reference_content_type=content_type,
        reference_object_id=document.id,
    ).order_by("-send_date")

    last = qs.first()
    if days_until < 0 or days_until <= 7:
        # alerta diaria: no duplicar en el mismo día
        return not qs.filter(send_date__date=today).exists()

    if days_until <= 30:
        if not last:
            return True
        delta_days = (today - last.send_date.date()).days
        return delta_days >= 7

    return False
