from __future__ import annotations

import base64
import io
import json
import logging
import mimetypes
import threading
import time
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable, Optional

import httpx
import openai

from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone
from openai import OpenAI
import pypdfium2 as pdfium

from .models import Document
from .image_service import ensure_car_image
from .ocr import extract_dates

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
            payload = self._call_openai_with_retry(document, api_key)
        except openai.RateLimitError as exc:  # pragma: no cover - dependencia externa
            logger.warning("OpenAI rate limit para documento %s", document.pk)
            self._mark_rate_limit(document, exc)
            return
        except Exception as exc:  # pragma: no cover - resiliencia IO
            logger.exception("Fallo analizando documento %s", document.pk)
            self._mark_failure(document, f"No se pudo procesar el documento: {exc}")
            return

        document.ai_payload = payload
        document.ai_checked_at = timezone.now()
        document.ai_feedback = payload.get("reason", "")

        doc_type_text = (payload.get("document_type") or "").lower()
        raw_text_full = payload.get("raw_text") or ""
        raw_text = raw_text_full.lower()
        readable = bool(payload.get("readable"))

        is_license = "licencia" in doc_type_text or "licencia" in raw_text
        fields = payload.get("fields") or {}
        document.license_metadata = fields

        if not readable:
            document.ai_status = Document.AIStatus.WARNING
            document.is_license_valid = False
            if not document.ai_feedback:
                document.ai_feedback = "El archivo no es legible."
            document.license_validation_message = document.ai_feedback
        elif not is_license:
            document.ai_status = Document.AIStatus.WARNING
            document.is_license_valid = False
            if not document.ai_feedback:
                document.ai_feedback = (
                    "No encontramos 'Licencia de Tránsito' en el documento."
                )
            document.license_validation_message = document.ai_feedback
        else:
            document.ai_status = Document.AIStatus.COMPLETED
            document.is_license_valid = True
            message = "Documento válido"
            document.license_validation_message = message
            if not document.ai_feedback:
                document.ai_feedback = message
            self._apply_license_fields(document, fields)
            issued_date, expiry_date = extract_dates(raw_text_full)
            if issued_date:
                document.issue_date = issued_date
            if expiry_date:
                document.expiry_date = expiry_date

        document.save(
            update_fields=[
                "ai_status",
                "ai_feedback",
                "ai_payload",
                "ai_checked_at",
                "license_metadata",
                "is_license_valid",
                "license_validation_message",
                "issue_date",
                "expiry_date",
                "provider",
                "notes",
                "amount",
            ],
        )
        try:
            ensure_car_image(document.car)
        except Exception:  # pragma: no cover - background safety
            logger.exception("No se pudo generar la imagen del vehículo %s", document.car_id)

    def _call_openai_with_retry(self, document: Document, api_key: str) -> dict[str, Any]:
        max_retries = int(getattr(settings, "OPENAI_MAX_RETRIES", 4))
        backoff_base = float(getattr(settings, "OPENAI_RETRY_BACKOFF", 5))
        for attempt in range(1, max_retries + 1):
            try:
                return self._call_openai_once(document, api_key)
            except (openai.RateLimitError, openai.APIError) as exc:
                if attempt == max_retries:
                    raise
                delay = backoff_base * attempt
                logger.warning(
                    "OpenAI throttled (intento %s/%s) doc %s: %s. Reintentando en %.1fs",
                    attempt,
                    max_retries,
                    document.pk,
                    exc,
                    delay,
                )
                time.sleep(delay)

        raise RuntimeError("OpenAI retries exceeded")

    def _call_openai_once(self, document: Document, api_key: str) -> dict[str, Any]:
        client = OpenAI(api_key=api_key)
        images = self._load_document_images(document)
        max_bytes = 8 * 1024 * 1024
        system_prompt = (
            "Eres un verificador de documentos colombianos. "
            "Analiza la imagen de una 'Licencia de Tránsito' y responde "
            "exclusivamente con JSON válido."
        )
        user_prompt = (
            "Extrae TODAS las fechas y datos visibles de la Licencia de Tránsito. "
            "Busca expresiones como 'FECHA EXP. LIC. TTO.', 'FECHA VENCIMIENTO', 'FECHA MATRÍCULA'. "
            "Responde este JSON exacto: "
            '{"readable":bool,"document_type":string,"reason":string,'
            '"confidence":number,"raw_text":string,"fields":{"owner":string,'
            '"plate":string,"vin":string,"service":string,"class":string,'
            '"issue_date":string,"expiry_date":string}}. '
            "Si la imagen no es legible coloca readable=false y explica en 'reason'. "
            "Si no es una licencia, indícalo en 'reason'. "
            "Incluye en raw_text el texto completo que puedas leer, especialmente las líneas donde aparecen fechas." 
        )
        contents = [
            {"type": "input_text", "text": user_prompt},
        ]
        for img_bytes, mime_type in images:
            if len(img_bytes) > max_bytes:
                raise ValueError("El archivo supera el límite de 8MB para análisis.")
            encoded = base64.b64encode(img_bytes).decode("utf-8")
            contents.append(
                {
                    "type": "input_image",
                    "image_url": f"data:{mime_type};base64,{encoded}",
                }
            )
        response = client.responses.create(
            model=getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0,
            input=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": contents,
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
            return self._parse_json_payload(raw_response)
        except json.JSONDecodeError as exc:
            logger.error("Respuesta de IA no es JSON: %s", raw_response)
            raise ValueError("La IA devolvió un formato inesperado.") from exc

    def _load_document_images(self, document: Document) -> list[tuple[bytes, str]]:
        file_path = document.document_file.path
        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or "image/jpeg"
        if mime_type == "application/pdf":
            return self._render_pdf_pages(file_path)
        with open(file_path, "rb") as file_pointer:
            return [(file_pointer.read(), mime_type)]

    def _render_pdf_pages(self, path: str) -> list[tuple[bytes, str]]:
        pdf = pdfium.PdfDocument(path)
        if len(pdf) == 0:
            raise ValueError("El PDF no contiene páginas.")
        images: list[tuple[bytes, str]] = []
        for index in range(len(pdf)):
            page = pdf.get_page(index)
            bitmap = page.render(scale=3.5)
            pil_image = bitmap.to_pil()
            buffer = io.BytesIO()
            pil_image.save(buffer, format="PNG")
            images.append((buffer.getvalue(), "image/png"))
            page.close()
        pdf.close()
        return images

    def _mark_failure(self, document: Document, message: str) -> None:
        document.ai_status = Document.AIStatus.FAILED
        document.ai_feedback = message
        document.ai_checked_at = timezone.now()
        document.save(update_fields=["ai_status", "ai_feedback", "ai_checked_at"])

    def _mark_rate_limit(self, document: Document, exc: Exception) -> None:
        message = (
            "Servicio de IA temporalmente saturado. Intenta nuevamente en unos minutos."
        )
        document.ai_status = Document.AIStatus.WARNING
        document.ai_feedback = message
        document.ai_checked_at = timezone.now()
        document.save(update_fields=["ai_status", "ai_feedback", "ai_checked_at"])

    def _apply_license_fields(self, document: Document, fields: dict[str, Any]) -> None:
        """Map structured fields to the Document record."""
        if not fields:
            return
        document.provider = fields.get("expedidor", document.provider)
        document.notes = "\n".join(
            f"{key.title()}: {value}"
            for key, value in fields.items()
            if isinstance(value, str) and value and key not in {"issue_date", "expiry_date"}
        )
        issue = self._parse_date(fields.get("issue_date"))
        expiry = self._parse_date(fields.get("expiry_date"))
        if issue:
            document.issue_date = issue
        if expiry:
            document.expiry_date = expiry

    @staticmethod
    def _parse_date(value: Any) -> datetime.date | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str):
            for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
                try:
                    return datetime.strptime(value.strip(), fmt).date()
                except ValueError:
                    continue
        return None

    @staticmethod
    def _parse_json_payload(raw_response: str) -> dict[str, Any]:
        """Accept OpenAI responses with optional markdown fences."""
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].lstrip()
            if "```" in cleaned:
                cleaned = cleaned.split("```", 1)[0].strip()
        if not cleaned.startswith("{"):
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and start < end:
                cleaned = cleaned[start : end + 1]
        return json.loads(cleaned)


@dataclass
class SoatLookupResult:
    plate: str
    policy_number: Optional[str]
    insurer: Optional[str]
    issue_date: Optional[date]
    expiry_date: Optional[date]
    premium: Optional[Decimal]
    responsibilities: list[str]
    status: str
    source: str
    payload: dict[str, Any]


class SoatLookupService:
    """Fetch SOAT data from configured provider (or mock fallback)."""

    def __init__(self, document_id: int):
        self.document_id = document_id

    def run(self) -> bool:
        document = (
            Document.objects.select_related("car__user").filter(pk=self.document_id).first()
        )
        if not document:
            logger.warning("Documento %s no existe para SOAT.", self.document_id)
            return False
        if document.type != Document.DocumentType.SOAT:
            logger.debug(
                "Documento %s no es SOAT (tipo=%s); se omite lookup.",
                self.document_id,
                document.type,
            )
            return False

        result = lookup_soat_payload(document.car.plate)
        if not result:
            logger.info("No se encontró información SOAT para la placa %s.", document.car.plate)
            return False

        document.external_payload = result.payload
        document.external_source = result.source
        document.external_status = result.status
        document.external_fetched_at = timezone.now()
        update_fields = [
            "external_payload",
            "external_source",
            "external_status",
            "external_fetched_at",
        ]

        if result.issue_date:
            document.issue_date = result.issue_date
            update_fields.append("issue_date")
        if result.expiry_date:
            document.expiry_date = result.expiry_date
            update_fields.append("expiry_date")
        if result.premium is not None:
            document.amount = result.premium
            update_fields.append("amount")
        if result.insurer and not document.provider:
            document.provider = result.insurer
            update_fields.append("provider")

        document.save(update_fields=update_fields)
        return True


def enqueue_license_analysis(document_id: int) -> None:
    def _run():
        close_old_connections()
        try:
            DocumentAIService(document_id).run()
        finally:  # pragma: no cover - cleanup
            close_old_connections()

    threading.Thread(target=_run, daemon=True).start()


def lookup_soat_payload(plate: str) -> Optional[SoatLookupResult]:
    plate = (plate or "").upper()
    if not plate:
        return None
    payload = None
    provider_url = getattr(settings, "SOAT_PROVIDER_URL", "")
    if provider_url:
        try:
            payload = _fetch_from_provider(provider_url, plate)
        except Exception:
            logger.exception("Fallo consultando proveedor SOAT oficial.")
    if not payload:
        try:
            payload = _load_mock_soat_entry(plate)
        except Exception:
            logger.exception("No se pudo cargar el mock de SOAT.")
    if not payload:
        return None
    return _normalize_soat_payload(payload, plate)


def _fetch_from_provider(url: str, plate: str) -> dict[str, Any]:
    headers = {}
    token = getattr(settings, "SOAT_PROVIDER_TOKEN", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    timeout = getattr(settings, "SOAT_PROVIDER_TIMEOUT", 12)
    response = httpx.get(
        url,
        params={"plate": plate},
        headers=headers,
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    if isinstance(data, list) and data:
        return data[0]
    return data


def _load_mock_soat_entry(plate: str) -> Optional[dict[str, Any]]:
    mock_path = getattr(settings, "SOAT_MOCK_DATA_PATH", "")
    if not mock_path:
        return None
    path = Path(mock_path)
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as handler:
        entries = json.load(handler)
    for entry in entries:
        if entry.get("plate", "").upper() == plate.upper():
            return entry
    return None


def _normalize_soat_payload(payload: dict[str, Any], plate: str) -> SoatLookupResult:
    body = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    policy = body.get("policy") if isinstance(body.get("policy"), dict) else body
    responsibilities = policy.get("responsibilities") or policy.get("coverages") or policy.get("covers") or []
    if isinstance(responsibilities, str):
        responsibilities_list = [responsibilities]
    else:
        responsibilities_list = [str(item) for item in responsibilities] if isinstance(responsibilities, Iterable) else []
    premium = _to_decimal(policy.get("premium") or policy.get("valor") or policy.get("amount"))
    return SoatLookupResult(
        plate=plate,
        policy_number=policy.get("policy_number") or policy.get("policyNumber"),
        insurer=policy.get("insurer") or policy.get("aseguradora") or policy.get("company"),
        issue_date=_parse_date_value(policy.get("issue_date") or policy.get("issueDate")),
        expiry_date=_parse_date_value(policy.get("expiry_date") or policy.get("expiryDate")),
        premium=premium,
        responsibilities=responsibilities_list,
        status=str(policy.get("status") or "fetched").lower(),
        source=payload.get("source")
        or ("SOAT Provider" if getattr(settings, "SOAT_PROVIDER_URL", "") else "LosToys Mock Dataset"),
        payload=payload,
    )


def _parse_date_value(value: Any) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(value.strip(), fmt).date()
            except ValueError:
                continue
    return None


def _to_decimal(value: Any) -> Optional[Decimal]:
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def enqueue_soat_lookup(document_id: int) -> None:
    def _run():
        close_old_connections()
        try:
            SoatLookupService(document_id).run()
        finally:
            close_old_connections()

    threading.Thread(target=_run, daemon=True).start()


def run_soat_lookup(document_id: int) -> bool:
    return SoatLookupService(document_id).run()
