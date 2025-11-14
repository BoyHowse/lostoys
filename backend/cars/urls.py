from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CarSoatView,
    CarViewSet,
    CreditViewSet,
    DocumentViewSet,
    MaintenanceViewSet,
)

app_name = "cars"

router = DefaultRouter()
router.register(r"cars", CarViewSet, basename="car")
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"credits", CreditViewSet, basename="credit")
router.register(r"maintenances", MaintenanceViewSet, basename="maintenance")

urlpatterns = router.urls + [
    path("cars/<int:pk>/soat/", CarSoatView.as_view(), name="car-soat"),
]
