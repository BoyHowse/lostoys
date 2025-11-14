import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.mail import EmailMultiAlternatives, send_mail
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .utils.email_templates import verification_email_html

logger = logging.getLogger(__name__)


def _send_verification_email(user: User) -> None:
    language = "es" if getattr(user, "country", "co").lower() == "co" else "en"
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verify_url = f"{frontend_url}/verify/{user.verification_token}/"
    html = verification_email_html(
        username=user.username,
        verify_url=verify_url,
        language=language,
    )
    msg = EmailMultiAlternatives(
        subject="Verify your LosToys account",
        body="",
        from_email="LosToys <wwwlostoys@gmail.com>",
        to=[user.email],
    )
    msg.attach_alternative(html, "text/html")
    try:
        msg.send()
    except Exception:
        logger.error("Email sending failed", exc_info=True)
        raise


def _pending_user_from_session(request) -> User | None:
    if request.user.is_authenticated:
        return request.user
    user_id = request.session.get("pending_verification_user_id")
    if not user_id:
        return None
    return User.objects.filter(pk=user_id).first()


@method_decorator(csrf_exempt, name="dispatch")
class SessionLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not user.is_verified:
            return Response(
                {
                    "success": False,
                    "message": "Debes verificar tu correo antes de iniciar sesión.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response(
                {"detail": "User is inactive."}, status=status.HTTP_403_FORBIDDEN
            )

        login(request, user)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionLogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_verified = False
        user.verification_token = uuid.uuid4()
        user.verification_sent_at = timezone.now()
        user.save(update_fields=["is_verified", "verification_token", "verification_sent_at"])
        request.session["pending_verification_user_id"] = user.pk
        request.session.modified = True
        try:
            _send_verification_email(user)
        except Exception:
            return Response(
                {
                    "success": False,
                    "message": "No pudimos enviar el correo de verificación. Intenta más tarde.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {"success": True, "message": "Cuenta creada. Revisa tu correo para activarla."},
            status=status.HTTP_201_CREATED,
        )


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


@api_view(["GET"])
def test_email(request):
    send_mail(
        subject="LosToys Email Test",
        message="Correo funcionando correctamente.",
        from_email="LosToys <wwwlostoys@gmail.com>",
        recipient_list=["wwwlostoys@gmail.com"],
        fail_silently=False,
    )
    return Response({"success": True})


@api_view(["POST"])
def resend_verification_email(request):
    user = _pending_user_from_session(request)
    if not user:
        return Response(
            {"success": False, "error": "Autenticación requerida."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if user.is_verified:
        return Response(
            {"success": False, "message": "Esta cuenta ya está verificada."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user.verification_token = uuid.uuid4()
    user.verification_sent_at = timezone.now()
    user.save(update_fields=["verification_token", "verification_sent_at"])
    try:
        _send_verification_email(user)
    except Exception:
        return Response(
            {"success": False, "message": "No se pudo reenviar el correo."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response({"success": True, "message": "Correo reenviado."})


@api_view(["GET"])
def verify_account(request, token):
    try:
        user = User.objects.get(verification_token=token)
    except User.DoesNotExist:
        logger.warning("Token inválido: %s", token)
        return Response({"success": False, "error": "Token inválido."}, status=400)

    if not user.verification_sent_at:
        user.verification_sent_at = timezone.now()

    if timezone.now() - user.verification_sent_at > timedelta(hours=24):
        logger.info("Token expirado para usuario %s", user.email)
        return Response(
            {"success": False, "error": "El enlace ha expirado. Solicita uno nuevo."},
            status=400,
        )

    user.is_verified = True
    user.verification_token = uuid.uuid4()
    user.verification_sent_at = timezone.now()
    user.save(update_fields=["is_verified", "verification_token", "verification_sent_at"])
    if request.session.get("pending_verification_user_id") == user.pk:
        request.session.pop("pending_verification_user_id", None)
    return Response({"success": True, "message": "Cuenta verificada exitosamente."})
