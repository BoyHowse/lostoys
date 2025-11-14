from rest_framework import serializers

from .models import Car, Credit, Document, Maintenance


class DocumentSerializer(serializers.ModelSerializer):
    status_indicator = serializers.CharField(read_only=True)
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    document_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Document
        fields = (
            "id",
            "car",
            "type",
            "type_display",
            "issue_date",
            "expiry_date",
            "amount",
            "provider",
            "document_file",
            "notes",
            "ai_status",
            "ai_feedback",
            "ai_checked_at",
            "ai_payload",
            "license_metadata",
            "is_license_valid",
            "license_validation_message",
            "status_indicator",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "type_display",
            "ai_status",
            "ai_feedback",
            "ai_checked_at",
            "ai_payload",
            "created_at",
            "updated_at",
            "status_indicator",
            "license_metadata",
            "is_license_valid",
            "license_validation_message",
        )

    def validate(self, attrs):
        doc_type = attrs.get("type") or getattr(self.instance, "type", None)
        if doc_type == Document.DocumentType.TRANSIT_LICENSE and not (
            attrs.get("document_file") or getattr(self.instance, "document_file", None)
        ):
            raise serializers.ValidationError(
                {"document_file": "Este documento requiere una imagen legible."}
            )
        return super().validate(attrs)

    def validate_document_file(self, file):
        if not file:
            return file
        max_size_mb = 10
        if file.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(
                f"El archivo excede los {max_size_mb}MB permitidos."
            )
        content_type = getattr(file, "content_type", "") or ""
        allowed = content_type.startswith("image/") or content_type == "application/pdf"
        if not allowed:
            raise serializers.ValidationError(
                "Solo se permiten imágenes (JPG, PNG) o PDF."
            )
        return file


class CreditSerializer(serializers.ModelSerializer):
    next_payment_date = serializers.DateField(read_only=True)

    class Meta:
        model = Credit
        fields = (
            "id",
            "car",
            "bank",
            "total_amount",
            "monthly_payment",
            "start_date",
            "end_date",
            "payment_day",
            "remaining_balance",
            "next_payment_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "next_payment_date")


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = (
            "id",
            "car",
            "date",
            "concept",
            "cost",
            "workshop",
            "notes",
            "receipt_file",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CarSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)
    credits = CreditSerializer(many=True, read_only=True)
    maintenances = MaintenanceSerializer(many=True, read_only=True)
    health_status = serializers.CharField(read_only=True)

    class Meta:
        model = Car
        fields = (
            "id",
            "user",
            "brand",
            "model",
            "plate",
            "year",
            "photo",
            "estimated_value",
            "status",
            "health_status",
            "documents",
            "credits",
            "maintenances",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "health_status", "user")

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user
        validated_data["plate"] = validated_data["plate"].upper()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "plate" in validated_data:
            validated_data["plate"] = validated_data["plate"].upper()
        return super().update(instance, validated_data)
