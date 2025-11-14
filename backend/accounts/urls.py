from django.urls import path

from .views import (
    CurrentUserView,
    RegisterView,
    SessionLoginView,
    SessionLogoutView,
    resend_verification_email,
    test_email,
    verify_account,
)

app_name = "accounts"

urlpatterns = [
    path("login/", SessionLoginView.as_view(), name="login"),
    path("logout/", SessionLogoutView.as_view(), name="logout"),
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("email/test/", test_email, name="email-test"),
    path("email/verify/resend/", resend_verification_email, name="email-verify-resend"),
    path("verify/<uuid:token>/", verify_account, name="verify-account"),
]
