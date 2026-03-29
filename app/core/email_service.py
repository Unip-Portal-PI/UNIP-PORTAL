import logging

import requests
from app.core.config import settings

logger = logging.getLogger("app.email")


class EmailService:
    def __init__(self):
        self.resend_api_url = settings.RESEND_API_URL
        self.resend_api_key = settings.RESEND_API_KEY
        self.api_url = settings.EMAIL_API_URL
        self.api_key = settings.EMAIL_API_KEY
        self.from_email = settings.EMAIL_FROM

    def send_verification_code(self, user_email: str, code: str):
        code = str(code).strip()[:settings.OTP_LENGTH]
        subject = f"{code} e o seu codigo de ativacao AVP Conecta"
        body = (
            f"Ola! Seu codigo de verificacao e: {code}. "
            f"Ele expira em {settings.OTP_EXPIRATION_MINUTES} minutos."
        )
        html = f"<strong>{body}</strong>"

        # Priority 1: Resend (api-base model)
        if self.resend_api_key and self.resend_api_key.startswith("re_"):
            try:
                headers = {
                    "Authorization": f"Bearer {self.resend_api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "from": f"AVP Conecta <{self.from_email}>",
                    "to": [user_email],
                    "subject": subject,
                    "html": html,
                }
                response = requests.post(
                    self.resend_api_url,
                    headers=headers,
                    json=payload,
                    timeout=10,
                )
                if response.status_code in [200, 201, 202]:
                    logger.info("email_sent provider=resend to=%s", user_email)
                    return True
                logger.error("email_failed provider=resend status=%s response=%s", response.status_code, response.text)
            except Exception as e:
                logger.error("email_connection_error provider=resend error=%s", e, exc_info=True)

        # Priority 2: Generic e-mail API (legacy compatibility)
        if self.api_url and self.api_key and "EXAMPLE" not in self.api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "from": self.from_email,
                    "to": user_email,
                    "subject": subject,
                    "html": html,
                }
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
                if response.status_code in [200, 201, 202]:
                    logger.info("email_sent provider=legacy to=%s", user_email)
                    return True
                logger.error("email_failed provider=legacy status=%s", response.status_code)
                return False
            except Exception as e:
                logger.error("email_connection_error provider=legacy error=%s", e, exc_info=True)

        logger.warning("email_simulation to=%s subject=%s", user_email, subject)

        return False
