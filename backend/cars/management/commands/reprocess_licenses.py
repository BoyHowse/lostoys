"""Management command to re-run DocumentAIService for transit licenses."""

from __future__ import annotations

from django.core.management.base import BaseCommand

from cars.models import Document
from cars.services import DocumentAIService


class Command(BaseCommand):
    help = "Reanalyse 'Licencia de tránsito' documents to refresh OCR data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--id",
            dest="document_id",
            type=int,
            help="Process only the specified document ID.",
        )
        parser.add_argument(
            "--limit",
            dest="limit",
            type=int,
            help="Optional maximum number of documents to process (most recent first).",
        )

    def handle(self, *args, **options):
        document_id = options.get("document_id")
        limit = options.get("limit")

        queryset = Document.objects.filter(
            type=Document.DocumentType.TRANSIT_LICENSE,
            document_file__isnull=False,
        ).order_by("-updated_at")

        if document_id:
            queryset = queryset.filter(pk=document_id)
            if not queryset.exists():
                self.stderr.write(self.style.ERROR(f"Documento {document_id} no existe."))
                return

        if limit:
            queryset = queryset[:limit]

        total = queryset.count()
        if total == 0:
            self.stdout.write(self.style.WARNING("No hay documentos para reprocesar."))
            return

        self.stdout.write(f"Reprocesando {total} documentos de licencia...")
        for doc in queryset:
            self.stdout.write(f"  • Documento #{doc.pk} ({doc.car.plate})")
            DocumentAIService(doc.pk).run()

        self.stdout.write(self.style.SUCCESS("Proceso completado."))
