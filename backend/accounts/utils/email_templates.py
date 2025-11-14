def verification_email_html(username, verify_url, language):

    if language == "es":
        title = "Bienvenido a LosToys"
        subtitle = f"Hola {username}, tu cuenta está casi lista."
        button_text = "Verificar mi cuenta"
        footer = "Gracias por unirte a LosToys."
    else:
        title = "Welcome to LosToys"
        subtitle = f"Hi {username}, your account is almost ready."
        button_text = "Verify my account"
        footer = "Thanks for joining LosToys."

    return f"""
    <html>
    <body style="background:#f5f5f5;padding:30px;font-family:Arial;">
        <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:12px;
                    box-shadow:0 3px 10px rgba(0,0,0,0.1);">
            <h1 style="color:#ff4d4d;text-align:center;margin-bottom:20px;">{title}</h1>
            <p style="font-size:16px;color:#333;text-align:center;">{subtitle}</p>

            <div style="text-align:center;margin-top:30px;">
                <a href="{verify_url}"
                   style="font-size:18px;background:#ff4d4d;color:white;padding:14px 28px;
                          border-radius:8px;text-decoration:none;font-weight:bold;">
                    {button_text}
                </a>
            </div>

            <p style="margin-top:40px;text-align:center;color:#555;font-size:13px;">
                {footer}
            </p>
        </div>
    </body>
    </html>
    """
