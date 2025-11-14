from __future__ import annotations

import base64
import io
import json
import logging
import mimetypes
import threading
from dataclasses import dataclass
from typing import Any

from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone
from openai import OpenAI
import pypdfium2 as pdfium

from .models import Document

logger = logging.getLogger(__name__)


@dataclass
class DocumentAIService:
    document_id: int

    def run(self) -> None:
        document = (
            Document.objects.select_related("car__user").filter(pk=self.document_id).first()
        )
        if not document:
            logger.warning("Documento %s no existe para análisis.", self.document_id)
            return
        if not document.document_file:
            logger.warning(
                "Documento %s no tiene archivo para analizar.", self.document_id
            )
            return

        api_key = getattr(settings, "OPENAI_API_KEY", "")
        if not api_key:
            self._mark_failure(
                document, "Servicio de IA no configurado (OPENAI_API_KEY faltante)."
            )
            return

        document.ai_status = Document.AIStatus.PROCESSING
        document.ai_feedback = ""
        document.ai_checked_at = None
        document.save(update_fields=["ai_status", "ai_feedback", "ai_checked_at"])

        try:
            payload = self._call_openai(document, api_key)
        except Exception as exc:  # pragma: no cover - resiliencia IO
            logger.exception("Fallo analizando documento %s", document.pk)
            self._mark_failure(document, f"No se pudo procesar el documento: {exc}")
            return

        document.ai_payload = payload
        document.ai_checked_at = timezone.now()
        document.ai_feedback = payload.get("reason", "")

        doc_type_text = (payload.get("document_type") or "").lower()
        raw_text = (payload.get("raw_text") or "").lower()
        readable = bool(payload.get("readable"))

        if not readable:
            document.ai_status = Document.AIStatus.WARNING
            if not document.ai_feedback:
                document.ai_feedback = "El archivo no es legible."
        elif "licencia" not in doc_type_text and "licencia" not in raw_text:
            document.ai_status = Document.AIStatus.WARNING
            if not document.ai_feedback:
                document.ai_feedback = (
                    "No encontramos 'Licencia de Tránsito' en el documento."
                )
        else:
            document.ai_status = Document.AIStatus.COMPLETED
            if not document.ai_feedback:
                document.ai_feedback = "Documento verificado y legible."

        document.save(
            update_fields=[
                "ai_status",
                "ai_feedback",
                "ai_payload",
                "ai_checked_at",
            ]
        )

    def _call_openai(self, document: Document, api_key: str) -> dict[str, Any]:
        client = OpenAI(api_key=api_key)
        image_bytes, mime_type = self._load_document_bytes(document)
        max_bytes = 8 * 1024 * 1024
        if len(image_bytes) > max_bytes:
            raise ValueError("El archivo supera el límite de 8MB para análisis.")
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        system_prompt = (
            "Eres un verificador de documentos colombianos. "
            "Analiza la imagen de una 'Licencia de Tránsito' y responde "
            "exclusivamente con JSON válido."
        )
        user_prompt = (
            "Extrae los datos visibles de la Licencia de Tránsito. "
            "Responde este JSON exacto: "
            '{"readable":bool,"document_type":string,"reason":string,'
            '"confidence":number,"raw_text":string,"fields":{"owner":string,'
            '"plate":string,"vin":string,"service":string,"class":string,'
            '"issue_date":string,"expiry_date":string}}. '
            "Si la imagen no es legible coloca readable=false y explica en 'reason'. "
            "Si no es una licencia, indícalo en 'reason'."
        )
        response = client.responses.create(
            model=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0,
            input=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": user_prompt},
                        {
                            "type": "input_image",
                            "image_url": f"data:{mime_type};base64,{encoded}",
                        },
                    ],
                },
            ],
        )
        text_chunks: list[str] = []
        for block in response.output:
            for content in getattr(block, "content", []):
                if content.type == "output_text":
                    text_chunks.append(content.text)
        raw_response = "".join(text_chunks).strip()
        try:
            return json.loads(raw_response)
        except json.JSONDecodeError as exc:
            logger.error("Respuesta de IA no es JSON: %s", raw_response)
            raise ValueError("La IA devolvió un formato inesperado.") from exc

    def _load_document_bytes(self, document: Document) -> tuple[bytes, str]:
        file_path = document.document_file.path
        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or "image/jpeg"
        if mime_type == "application/pdf":
            return self._render_pdf_to_png(file_path)
        with open(file_path, "rb") as file_pointer:
            return file_pointer.read(), mime_type

    def _render_pdf_to_png(self, path: str) -> tuple[bytes, str]:
        pdf = pdfium.PdfDocument(path)
        if len(pdf) == 0:
            raise ValueError("El PDF no contiene páginas.")
        page = pdf.get_page(0)
        bitmap = page.render(scale=2.5)
        pil_image = bitmap.to_pil()
        page.close()
        pdf.close()
        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        return buffer.getvalue(), "image/png"

    def _mark_failure(self, document: Document, message: str) -> None:
        document.ai_status = Document.AIStatus.FAILED
        document.ai_feedback = message
        document.ai_checked_at = timezone.now()
        document.save(update_fields=["ai_status", "ai_feedback", "ai_checked_at"])


def enqueue_license_analysis(document_id: int) -> None:
    def _run():
        close_old_connections()
        try:
            DocumentAIService(document_id).run()
        finally:  # pragma: no cover - cleanup
            close_old_connections()

    threading.Thread(target=_run, daemon=True).start()
