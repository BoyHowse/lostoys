from django.db import transaction
from django.shortcuts import get_object_or_404
from typing import Any
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Car, Credit, Document, Maintenance
from .services import enqueue_license_analysis, enqueue_soat_lookup, run_soat_lookup
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
        is_colombia = (
            document.car.user.country
            and document.car.user.country.lower() == "co"
        )
        if (
            document.type == Document.DocumentType.TRANSIT_LICENSE
            and is_colombia
            and document.document_file
        ):
            if not force:
                return
            Document.objects.filter(pk=document.pk).update(
                ai_status=Document.AIStatus.PENDING,
                ai_feedback="",
                ai_payload=None,
                ai_checked_at=None,
            )
            transaction.on_commit(lambda: enqueue_license_analysis(document.pk))

        if document.type == Document.DocumentType.SOAT:
            transaction.on_commit(lambda: enqueue_soat_lookup(document.pk))


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


class CarSoatView(APIView):
    permission_classes = (IsAuthenticatedOwner,)

    def get(self, request, pk: int):
        car = get_object_or_404(
            Car.objects.prefetch_related("documents"), pk=pk, user=request.user
        )
        document = (
            car.documents.filter(type=Document.DocumentType.SOAT)
            .order_by("-updated_at", "-expiry_date")
            .first()
        )
        if not document:
            return Response(
                {"document": None, "external": None},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DocumentSerializer(document)
        return Response(self._build_payload(serializer.data, document))

    def post(self, request, pk: int):
        car = get_object_or_404(
            Car.objects.prefetch_related("documents"), pk=pk, user=request.user
        )
        document = (
            car.documents.filter(type=Document.DocumentType.SOAT)
            .order_by("-updated_at", "-expiry_date")
            .first()
        )
        if not document:
            return Response(
                {"success": False, "message": "No hay documentos SOAT asociados."},
                status=status.HTTP_404_NOT_FOUND,
            )
        run_soat_lookup(document.pk)
        document.refresh_from_db()
        serializer = DocumentSerializer(document)
        payload = self._build_payload(serializer.data, document)
        payload["success"] = True
        return Response(payload)

    @staticmethod
    def _build_payload(serialized_document: dict[str, Any], document: Document):
        external_payload = document.external_payload or {}
        return {
            "document": serialized_document,
            "external": {
                "status": document.external_status or "desconocido",
                "source": document.external_source or "Sin fuente",
                "fetched_at": document.external_fetched_at,
                "policy_number": external_payload.get("policy_number")
                or external_payload.get("policyNumber"),
                "insurer": external_payload.get("insurer")
                or external_payload.get("aseguradora"),
                "issue_date": external_payload.get("issue_date")
                or external_payload.get("issueDate"),
                "expiry_date": external_payload.get("expiry_date")
                or external_payload.get("expiryDate"),
                "premium": external_payload.get("premium")
                or external_payload.get("valor"),
                "responsibilities": external_payload.get("responsibilities")
                or external_payload.get("coverages")
                or [],
                "payload": external_payload,
            },
        }
