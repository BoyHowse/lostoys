from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Alerts",
            {
                "fields": (
                    "role",
                    "phone_number",
                    "receive_email_alerts",
                    "receive_sms_alerts",
                    "receive_whatsapp_alerts",
                )
            },
        ),
    )
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
    )
    list_filter = ("role", "is_active", "is_staff")
