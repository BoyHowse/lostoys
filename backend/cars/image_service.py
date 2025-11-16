"""Helpers to generate or reuse AI images for cars."""

from __future__ import annotations

import base64
import logging
import random
import uuid
from typing import Optional

from django.conf import settings
from django.core.files.base import ContentFile

from openai import OpenAI

from .models import Car, CarImageCatalog

LOGGER = logging.getLogger(__name__)
COLOR_CHOICES = [
    "silver",
    "graphite",
    "midnight blue",
    "carbon black",
    "pearl white",
    "deep red",
]


def ensure_car_image(car: Car) -> None:
    """Ensure the car has a photo, using cached AI renders if available."""

    if car.photo:
        return
    brand = car.brand or "Car"
    model = car.model or "Vehicle"
    year = car.year or "2024"
    cached = CarImageCatalog.objects.filter(
        brand__iexact=brand, model__iexact=model
    ).first()
    if cached:
        car.photo = cached.image
        car.save(update_fields=["photo"])
        return

    color = random.choice(COLOR_CHOICES)

    image_bytes = _generate_image_bytes(brand, model, str(year), color)
    if not image_bytes:
        return

    filename = f"cars/photos/ai_{uuid.uuid4().hex}.png"
    car.photo.save(filename, ContentFile(image_bytes), save=True)
    CarImageCatalog.objects.create(
        brand=brand,
        model=model,
        color_key=color,
        image=car.photo,
    )


def _generate_image_bytes(brand: str, model: str, year: str, color: str) -> Optional[bytes]:
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        LOGGER.warning("No OPENAI_API_KEY configured for car images.")
        return None
    prompt = (
        f"Ultra realistic photo of a {color} {year} {brand} {model} parked in a studio, "
        "cinematic lighting, hero shot, glossy finish, 8k render"
    )
    try:
        client = OpenAI(api_key=api_key)
        response = client.images.generate(
            model=getattr(settings, "OPENAI_IMAGE_MODEL", "gpt-image-1"),
            prompt=prompt,
            size="512x512",
            n=1,
        )
        data = response.data[0].b64_json
        return base64.b64decode(data)
    except Exception:  # pragma: no cover - relies on external API
        LOGGER.exception("Failed to generate AI image for %s %s", brand, model)
        return None
