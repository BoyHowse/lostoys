from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from alerts.models import Notification
from cars.models import Car, Document


class Command(BaseCommand):
    help = "Seeds the database with a demo user, vehicles, and documents."

    def handle(self, *args, **options):
        User = get_user_model()

        superuser, created = User.objects.get_or_create(
            username="boy",
            defaults={
                "email": "boy@lostoys.com",
                "first_name": "Boy",
                "last_name": "Prestige",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created or not superuser.check_password("Prestige1$"):
            superuser.set_password("Prestige1$")
            superuser.save()
            self.stdout.write(self.style.SUCCESS("Superuser 'boy' ensured."))

        demo_user, _ = User.objects.get_or_create(
            username="demo",
            defaults={
                "email": "demo@lostoys.com",
                "first_name": "Demo",
                "last_name": "User",
                "role": User.Role.MANAGER,
                "receive_email_alerts": True,
                "receive_sms_alerts": False,
                "receive_whatsapp_alerts": False,
            },
        )
        if not demo_user.check_password("demo1234"):
            demo_user.set_password("demo1234")
            demo_user.save()

        car1, _ = Car.objects.get_or_create(
            user=demo_user,
            plate="ABC123",
            defaults={
                "brand": "Tesla",
                "model": "Model 3",
                "year": 2022,
                "estimated_value": Decimal("42000.00"),
            },
        )

        car2, _ = Car.objects.get_or_create(
            user=demo_user,
            plate="XYZ789",
            defaults={
                "brand": "Toyota",
                "model": "Hilux",
                "year": 2021,
                "estimated_value": Decimal("35000.00"),
            },
        )

        base_date = timezone.now().date()

        documents_data = [
            {
                "car": car1,
                "type": Document.DocumentType.SOAT,
                "issue_date": base_date - timedelta(days=200),
                "expiry_date": base_date + timedelta(days=30),
                "provider": "Sura",
            },
            {
                "car": car1,
                "type": Document.DocumentType.TECHNICAL,
                "issue_date": base_date - timedelta(days=300),
                "expiry_date": base_date + timedelta(days=7),
                "provider": "CentroTec",
            },
            {
                "car": car2,
                "type": Document.DocumentType.INSURANCE,
                "issue_date": base_date - timedelta(days=365),
                "expiry_date": base_date - timedelta(days=1),
                "provider": "Allianz",
            },
        ]

        for data in documents_data:
            Document.objects.get_or_create(
                car=data["car"],
                type=data["type"],
                defaults={
                    "issue_date": data["issue_date"],
                    "expiry_date": data["expiry_date"],
                    "amount": Decimal("450.00"),
                    "provider": data["provider"],
                },
            )

        Notification.objects.filter(user=demo_user).delete()

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
