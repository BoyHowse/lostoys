from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from twilio.base.exceptions import TwilioException
from twilio.rest import Client

from celery import shared_task

from .models import Notification


def _twilio_client() -> Client | None:
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
    if not account_sid or not auth_token:
        return None
    return Client(account_sid, auth_token)


@shared_task
def dispatch_notification(notification_id: int) -> None:
    notification = Notification.objects.filter(pk=notification_id).select_related("user").first()
    if not notification:
        return

    try:
        if notification.notification_type == Notification.NotificationType.EMAIL:
            _send_email(notification)
        elif notification.notification_type == Notification.NotificationType.WHATSAPP:
            _send_whatsapp(notification)
        elif notification.notification_type == Notification.NotificationType.SMS:
            _send_sms(notification)
        notification.status = Notification.Status.SENT
        notification.sent_at = timezone.now()
        notification.error_message = ""
    except Exception as exc:  # pragma: no cover - resilience
        notification.status = Notification.Status.FAILED
        notification.error_message = str(exc)
    notification.save(update_fields=["status", "sent_at", "error_message"])


def _send_email(notification: Notification) -> None:
    if not notification.user.email:
        raise ValueError("User has no email configured.")
    send_mail(
        subject="LosToys Alert",
        message=notification.message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[notification.user.email],
        fail_silently=False,
    )


def _send_whatsapp(notification: Notification) -> None:
    client = _twilio_client()
    if not client:
        raise ValueError("Twilio credentials are not configured.")
    to_number = getattr(notification.user, "phone_number", None)
    if not to_number:
        raise ValueError("User has no phone number configured.")
    from_number = getattr(settings, "TWILIO_WHATSAPP_NUMBER", "")
    if not from_number:
        raise ValueError("Missing Twilio WhatsApp number.")
    try:
        client.messages.create(
            body=notification.message,
            from_=f"whatsapp:{from_number}",
            to=f"whatsapp:{to_number}",
        )
    except TwilioException as exc:
        raise ValueError(f"WhatsApp delivery failed: {exc}") from exc


def _send_sms(notification: Notification) -> None:
    client = _twilio_client()
    if not client:
        raise ValueError("Twilio credentials are not configured.")
    to_number = getattr(notification.user, "phone_number", None)
    if not to_number:
        raise ValueError("User has no phone number configured.")
    from_number = getattr(settings, "TWILIO_SMS_NUMBER", "")
    if not from_number:
        raise ValueError("Missing Twilio SMS number.")
    try:
        client.messages.create(
            body=notification.message,
            from_=from_number,
            to=to_number,
        )
    except TwilioException as exc:
        raise ValueError(f"SMS delivery failed: {exc}") from exc
