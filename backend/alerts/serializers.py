from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    reference_model = serializers.CharField(
        source="reference_content_type.model", read_only=True
    )
    reference_app = serializers.CharField(
        source="reference_content_type.app_label", read_only=True
    )

    class Meta:
        model = Notification
        fields = (
            "id",
            "user",
            "notification_type",
            "message",
            "send_date",
            "status",
            "reference_content_type",
            "reference_object_id",
            "reference_model",
            "reference_app",
            "created_at",
            "sent_at",
            "error_message",
        )
        read_only_fields = (
            "id",
            "user",
            "status",
            "created_at",
            "sent_at",
            "error_message",
            "reference_model",
            "reference_app",
        )

    def validate_reference_content_type(self, value):
        if value and not isinstance(value, ContentType):
            raise serializers.ValidationError("Invalid content type.")
        return value
