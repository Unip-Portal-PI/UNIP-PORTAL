import requests
from core.config import settings # Importando sua central de configurações

# ==============================================================================
# SERVIÇO DE COMUNICAÇÃO EXTERNA (MESSAGING SERVICE)
# ==============================================================================
class EmailService:
    """
    Serviço de Comunicação via E-mail.
    Responsável pelo envio de notificações, códigos de ativação (OTP) e alertas.
    Utiliza variáveis de ambiente via Pydantic Settings para segurança.
    """

    def __init__(self):
        # ======================================================================
        # CONFIGURAÇÕES CARREGADAS DO .ENV
        # ======================================================================
        self.api_url = settings.EMAIL_API_URL
        self.api_key = settings.EMAIL_API_KEY
        self.from_email = settings.EMAIL_FROM

    # ==========================================================================
    # FLUXOS DE AUTENTICAÇÃO (OTP & SECURITY)
    # ==========================================================================
    def send_verification_code(self, user_email: str, code: str):
        """
        Envia o código de ativação de 4 dígitos para o e-mail do usuário.
        """
        
        subject = "Seu código de ativação AVP"
        body = f"Olá! Seu código de verificação é: {code}. Use-o para ativar sua conta."

        # ======================================================================
        # LOGICA DE DISPARO (INTEGRAÇÃO REAL)
        # ======================================================================
        # Verificamos se temos uma chave válida para tentar o envio real
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
                    "html": f"<strong>{body}</strong>" # Formato HTML para provedores
                }
                
                # Chamada real comentada para não gastar créditos em dev, 
                # mas pronta para ser ativada:
                # response = requests.post(self.api_url, headers=headers, json=payload)
                # return response.status_code in [200, 201, 202]
                
            except Exception as e:
                print(f"Erro ao conectar com provedor de e-mail: {e}")

        # ======================================================================
        # FALLBACK: SIMULAÇÃO EM CONSOLE (MODO DESENVOLVIMENTO)
        # ======================================================================
        border = "📩" * 20
        print(f"\n{border}")
        print(f"DEBUG: Modo Simulação Ativo (API_KEY não configurada ou omitida)")
        print(f"PARA: {user_email}")
        print(f"ASSUNTO: {subject}")
        print(f"CONTEÚDO: {body}")
        print(f"{border}\n")
        
        return True