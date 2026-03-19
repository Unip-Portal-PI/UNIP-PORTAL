import requests
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.api_url = settings.EMAIL_API_URL
        self.api_key = settings.EMAIL_API_KEY
        self.from_email = settings.EMAIL_FROM

    def send_verification_code(self, user_email: str, code: str):
        subject = "Seu codigo de verificacao AVP Conecta"
        body = f"Ola! Seu codigo de verificacao e: {code}. Use-o para redefinir sua senha."

        if self.api_key and "REPLACE" not in self.api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "from": self.from_email,
                    "to": user_email,
                    "subject": subject,
                    "html": f"<strong>{body}</strong>",
                }
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
                return response.status_code in [200, 201, 202]
            except Exception as e:
                print(f"Erro ao conectar com provedor de e-mail: {e}")

        print(f"\n{'='*50}")
        print(f"DEBUG: Modo Simulacao Ativo")
        print(f"PARA: {user_email}")
        print(f"ASSUNTO: {subject}")
        print(f"CONTEUDO: {body}")
        print(f"{'='*50}\n")

        return True
