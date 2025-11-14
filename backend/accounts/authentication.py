from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session auth variant that skips CSRF checks for API clients."""

    def enforce_csrf(self, request):  # pragma: no cover - custom behavior
        return
