import resend
from core.config import settings

class EmailService:
    """
    Serviço de Comunicação via E-mail utilizando a API da Resend.
    Substitui o antigo SMTP da Umbler por uma API moderna.
    """

    def __init__(self):
        # A Resend utiliza a API Key diretamente da variável de ambiente ou settings
        resend.api_key = settings.RESEND_API_KEY
        
        # O 'from_email' DEVE ser um domínio verificado na Cloudflare/Resend
        self.from_email = settings.EMAIL_FROM 
        self.display_name = "AVP Conecta"

    def send_verification_code(self, user_email: str, code: str):
        """
        Envia o código de ativação de 6 caracteres com layout personalizado via Resend.
        """
        code = str(code).strip()[:6]
        subject = f"{code} é o seu código de ativação AVP Conecta"

        # HTML INTEGRADO CONFORME SOLICITADO
        html_body = f"""
        <html>

<body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 500px; margin: 0 auto; border: 1px solid #f1f1f1; border-radius: 5px; overflow: hidden;">
        <div style="color: #ffffff; padding-left: 0px;padding-top: 20px; text-align: left;">
            <img src="https://res.cloudinary.com/dbk3sjga8/image/upload/v1774067491/avp-v2-gray_cem9uc.png"
                style="width: 175px; margin-left: 10px;">
        </div>
        <div style="padding-left: 15px; padding-right: 15px; text-align: left;">
            <p style="font-size: 16px; margin: 0; margin-top: 30px;">Olá!</p>
            <p style="margin: 0; margin-bottom: 30px;">Você solicitou um código para ativação de conta ou recuperação de
                acesso. Utilize o código abaixo:</p>

            <div
                style="margin: 0px 0; padding: 30px; background-color: transparent; ; display: inline-block; border-radius: 6px; width: 80%; text-align: center;">
                <span style="font-size: 72px; font-weight: 900; letter-spacing: 5px; color: #FFCC00;">{code}</span>
            </div>

            <p style="font-size: 14px; color: #666;">Este código expira em {settings.OTP_EXPIRATION_MINUTES} minutos.
            </p>
        </div>
        <div
            style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #888; border-radius: 3px; margin-top: 30px; width: 95%; display: flex; flex-direction: row; align-items: center; justify-content: center;">
            <p style="margin: 0; width: 100%;">Este é um e-mail automático do sistema AVP Conecta. <br>Por favor, não
                responda.</p>
        </div>
    </div>
</body>

</html>
        """

        # Lógica de disparo via Resend
        if resend.api_key and "re_" in resend.api_key:
            try:
                params = {
                    "from": f"{self.display_name} <{self.from_email}>",
                    "to": [user_email],
                    "subject": subject,
                    "html": html_body,
                }
                
                result = resend.Emails.send(params)
                print(f"✅ E-mail enviado via Resend para: {user_email} | ID: {result.get('id')}")
                return True

            except Exception as e:
                print(f"❌ Erro na API da Resend: {e}")

        # FALLBACK: DEBUG CONSOLE (Sempre executa se a chave não estiver configurada ou a API falhar)
        border = "📩" * 15
        print(f"\n{border}")
        print(f" MODO SIMULAÇÃO (E-mail não enviado via API) ")
        print(f" PARA: {user_email}")
        print(f" CÓDIGO: {code}")
        print(f"{border}\n")
        
        return True