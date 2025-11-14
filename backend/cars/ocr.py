"""Utilities to extract dates from license OCR text."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional, Tuple


DATE_PATTERN = r"([0-3]?\d[/.-][0-1]?\d[/.-]\d{2,4})"


def _normalize_date(raw: str) -> Optional[datetime.date]:
    """Convert DD/MM/YYYY or variants to a date object."""

    try:
        cleaned = raw.strip().replace(".", "/").replace("-", "/")
        day, month, year = cleaned.split("/")
        if len(year) == 2:
            year = "20" + year
        return datetime(int(year), int(month), int(day)).date()
    except Exception:  # pragma: no cover - resilient to OCR noise
        return None


def extract_dates(text: str) -> Tuple[Optional[datetime.date], Optional[datetime.date]]:
    """Return issued/expiry dates detected in the OCR text."""

    issued = None
    expiry = None
    patterns = {
        "issued": rf"(fecha.?de.?expedici[oó]n|expedici[oó]n):?\s*{DATE_PATTERN}",
        "expiry": rf"(fecha.?de.?vencimiento|vence|v[aá]lido.?hasta):?\s*{DATE_PATTERN}",
    }

    normalized = text or ""
    for key, pattern in patterns.items():
        match = re.search(pattern, normalized, re.IGNORECASE)
        if not match:
            continue
        parsed = _normalize_date(match.group(2))
        if key == "issued":
            issued = parsed
        else:
            expiry = parsed

    return issued, expiry

