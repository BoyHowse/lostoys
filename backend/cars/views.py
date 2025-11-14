from django.db import transaction
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser

from .models import Car, Credit, Document, Maintenance
from .services import enqueue_license_analysis
from .serializers import (
    CarSerializer,
    CreditSerializer,
    DocumentSerializer,
    MaintenanceSerializer,
)


class IsAuthenticatedOwner(permissions.IsAuthenticated):
    """Ensures the user is authenticated; ownership checks happen per view."""


class CarViewSet(viewsets.ModelViewSet):
    serializer_class = CarSerializer
    permission_classes = (IsAuthenticatedOwner,)

    def get_queryset(self):
        return (
            Car.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("documents", "credits", "maintenances")
            .order_by("plate")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = (IsAuthenticatedOwner,)
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return (
            Document.objects.filter(car__user=self.request.user)
                .select_related("car__user")
                .order_by("expiry_date")
        )

    def perform_create(self, serializer):
        car = serializer.validated_data.get("car")
        self._assert_car_ownership(car)
        document = serializer.save()
        self._maybe_enqueue_ai(document)

    def perform_update(self, serializer):
        car = serializer.validated_data.get("car", serializer.instance.car)
        self._assert_car_ownership(car)
        document = serializer.save()
        file_replaced = "document_file" in serializer.validated_data
        self._maybe_enqueue_ai(document, force=file_replaced)

    def _assert_car_ownership(self, car: Car):
        if car.user != self.request.user:
            raise PermissionDenied("You do not have access to this car.")

    def _maybe_enqueue_ai(self, document: Document, force: bool = True) -> None:
        requires_license = document.type == Document.DocumentType.TRANSIT_LICENSE
        is_colombia = (
            document.car.user.country
            and document.car.user.country.lower() == "co"
        )
        if not (requires_license and is_colombia and document.document_file):
            return
        if not force:
            return
        if force:
            Document.objects.filter(pk=document.pk).update(
                ai_status=Document.AIStatus.PENDING,
                ai_feedback="",
                ai_payload=None,
                ai_checked_at=None,
            )
        transaction.on_commit(lambda: enqueue_license_analysis(document.pk))


class CreditViewSet(viewsets.ModelViewSet):
    serializer_class = CreditSerializer
    permission_classes = (IsAuthenticatedOwner,)

    def get_queryset(self):
        return Credit.objects.filter(car__user=self.request.user).select_related("car").order_by("-created_at")

    def perform_create(self, serializer):
        car = serializer.validated_data.get("car")
        self._assert_car_ownership(car)
        serializer.save()

    def perform_update(self, serializer):
        car = serializer.validated_data.get("car", serializer.instance.car)
        self._assert_car_ownership(car)
        serializer.save()

    def _assert_car_ownership(self, car: Car):
        if car.user != self.request.user:
            raise PermissionDenied("You do not have access to this car.")


class MaintenanceViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceSerializer
    permission_classes = (IsAuthenticatedOwner,)

    def get_queryset(self):
        return Maintenance.objects.filter(car__user=self.request.user).select_related("car").order_by("-date")

    def perform_create(self, serializer):
        car = serializer.validated_data.get("car")
        self._assert_car_ownership(car)
        serializer.save()

    def perform_update(self, serializer):
        car = serializer.validated_data.get("car", serializer.instance.car)
        self._assert_car_ownership(car)
        serializer.save()

    def _assert_car_ownership(self, car: Car):
        if car.user != self.request.user:
            raise PermissionDenied("You do not have access to this car.")
