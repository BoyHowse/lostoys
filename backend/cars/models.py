from __future__ import annotations

import calendar
from datetime import date

from django.conf import settings
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Car(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        INACTIVE = "inactive", "Inactive"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cars"
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    plate = models.CharField(max_length=20)
    year = models.PositiveIntegerField()
    photo = models.ImageField(upload_to="cars/photos/", blank=True, null=True)
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )

    class Meta:
        unique_together = ("user", "plate")
        ordering = ["plate"]

    def __str__(self) -> str:
        return f"{self.brand} {self.model} ({self.plate})"

    @property
    def health_status(self) -> str:
        """Return a traffic-light style status based on the closest document expiry."""
        upcoming_expiry = min(
            (doc.days_until_expiry() for doc in self.documents.all()),
            default=None,
        )
        if upcoming_expiry is None:
            return "green"
        if upcoming_expiry < 0:
            return "red"
        if upcoming_expiry <= 15:
            return "yellow"
        return "green"


class Document(TimeStampedModel):
    class DocumentType(models.TextChoices):
        SOAT = "SOAT", "SOAT"
        TECHNICAL = "Tecnomecanica", "Tecnomecánica"
        INSURANCE = "Insurance", "Insurance"
        REGISTRATION = "Registration", "Registration"
        TRANSIT_LICENSE = "transit_license", "Licencia de tránsito"

    class AIStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        WARNING = "warning", "Warning"
        FAILED = "failed", "Failed"

    ALERT_WINDOWS = (30, 15, 7)

    car = models.ForeignKey(
        Car, on_delete=models.CASCADE, related_name="documents", db_index=True
    )
    type = models.CharField(max_length=30, choices=DocumentType.choices)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    provider = models.CharField(max_length=120, blank=True)
    document_file = models.FileField(
        upload_to="cars/documents/", blank=True, null=True
    )
    notes = models.TextField(blank=True)
    ai_status = models.CharField(
        max_length=20,
        choices=AIStatus.choices,
        default=AIStatus.PENDING,
    )
    ai_feedback = models.TextField(blank=True)
    ai_payload = models.JSONField(blank=True, null=True)
    ai_checked_at = models.DateTimeField(blank=True, null=True)
    license_metadata = models.JSONField(blank=True, null=True)
    is_license_valid = models.BooleanField(default=False)
    license_validation_message = models.CharField(max_length=255, blank=True)
    external_status = models.CharField(max_length=50, blank=True)
    external_source = models.CharField(max_length=120, blank=True)
    external_payload = models.JSONField(blank=True, null=True)
    external_fetched_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["expiry_date"]

    def __str__(self) -> str:
        return f"{self.get_type_display()} - {self.car.plate}"

    def days_until_expiry(self) -> int:
        if not self.expiry_date:
            return 9999  # interpret as far future/no expiry
        today = timezone.now().date()
        return (self.expiry_date - today).days

    def requires_alert(self, days_before: int) -> bool:
        return self.days_until_expiry() == days_before

    def is_expired(self) -> bool:
        return self.days_until_expiry() < 0

    def status_indicator(self) -> str:
        remaining = self.days_until_expiry()
        if remaining < 0:
            return "red"
        if remaining <= 15:
            return "yellow"
        return "green"

    @property
    def is_expired(self) -> bool:
        return bool(self.expiry_date and self.expiry_date < timezone.now().date())


class Credit(TimeStampedModel):
    car = models.ForeignKey(
        Car, on_delete=models.CASCADE, related_name="credits", db_index=True
    )
    bank = models.CharField(max_length=120)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    payment_day = models.PositiveSmallIntegerField()
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.bank} - {self.car.plate}"

    def next_payment_date(self) -> date:
        today = timezone.now().date()
        year, month = today.year, today.month
        if today.day > self.payment_day:
            month += 1
            if month > 12:
                month = 1
                year += 1
        _, last_day = calendar.monthrange(year, month)
        return date(year, month, min(self.payment_day, last_day))


class Maintenance(TimeStampedModel):
    car = models.ForeignKey(
        Car, on_delete=models.CASCADE, related_name="maintenances", db_index=True
    )
    date = models.DateField()
    concept = models.CharField(max_length=150)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    workshop = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)
    receipt_file = models.FileField(
        upload_to="cars/maintenance/", blank=True, null=True
    )

    class Meta:
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"{self.concept} - {self.car.plate}"
