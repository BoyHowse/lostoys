from __future__ import annotations

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from cars.models import Document

from .models import Notification
from .tasks import dispatch_notification


def schedule_document_alerts() -> int:
    """Inspect document expiry dates and queue notifications as needed."""
    content_type = ContentType.objects.get_for_model(Document)
    alerts_created = 0
    now = timezone.now()
    today = now.date()

    documents = Document.objects.select_related("car__user")
    for document in documents:
        days_until = document.days_until_expiry()
        if days_until not in document.ALERT_WINDOWS and days_until != 0:
            continue

        user = document.car.user
        channels = _resolve_user_channels(user)
        if not channels:
            continue

        message = _build_document_message(document, days_until)

        for channel in channels:
            notification, created = Notification.objects.get_or_create(
                user=user,
                notification_type=channel,
                reference_content_type=content_type,
                reference_object_id=document.id,
                send_date=now,
                defaults={"message": message},
            )
            if created:
                alerts_created += 1
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
        status = "expired"
    elif days_until == 0:
        status = "due today"
    else:
        status = f"due in {days_until} days"
    return (
        f"{document.get_type_display()} for {document.car.plate} is {status}. "
        f"Provider: {document.provider or 'N/A'}."
    )
