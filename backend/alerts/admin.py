from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "notification_type",
        "status",
        "send_date",
        "sent_at",
    )
    list_filter = ("notification_type", "status")
    search_fields = ("user__username", "message")
