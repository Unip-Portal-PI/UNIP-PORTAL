import random
from fastapi import HTTPException, status
from core.security import hash_password, verify_password, create_access_token
from persistence.repositories.user_repository import UserRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.user_model import UserModel

# ==============================================================================
# SERVIÇO DE AUTENTICAÇÃO E IDENTIDADE (IAM - IDENTITY & ACCESS MANAGEMENT)
# ==============================================================================
class AuthService:
    """
    Serviço central de segurança. Gerencia o ciclo de vida do usuário,
    desde o auto-registro com OTP até a emissão de tokens JWT e auditoria.
    """

    def __init__(self, repo: UserRepository, audit_repo: AuditRepository):
        """
        Injeção de dependência dos repositórios de dados e logs de auditoria.
        """
        self.repo = repo
        self.audit_repo = audit_repo

    # ==========================================================================
    # FLUXO DE REGISTRO E ATIVAÇÃO (USER ONBOARDING)
    # ==========================================================================
    def register(self, name: str, registration_number: str, email: str, password: str, role: str, admin_id: str = "System"):
        """
        Cria um novo usuário com status pendente e gera o código OTP.
        Implementa sanitização rigorosa para evitar duplicidade silenciosa.
        """
        # 1. Sanitização e normalização para consistência no banco
        clean_email = email.lower().strip()
        clean_reg = registration_number.strip()
        
        # 2. Validação de duplicidade (Prevenção de conflito de conta)
        if self.repo.get_by_email(clean_email) or self.repo.get_by_registration(clean_reg):
            return None
        
        # 3. Geração do segredo OTP (4 dígitos)
        otp = f"{random.randint(1000, 9999)}"
        
        # 4. Criação do Modelo (Inativo por padrão para segurança)
        user = UserModel(
            name=name.strip(),
            registration_number=clean_reg,
            email=clean_email,
            password_hash=hash_password(password), # Criptografia unidirecional
            role=role,
            is_active=False,
            otp_code=otp
        )
        
        created = self.repo.create(user)
        
        # 5. Registro de Auditoria (Rastreabilidade de criação)
        if created:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="CREATE_USER",
                table_name="users",
                description=f"Usuário registrado: {created.email}. OTP: {otp} gerado."
            )
        return created

    # ==========================================================================
    # FLUXO DE AUTENTICAÇÃO (JWT ISSUANCE)
    # ==========================================================================
    def login(self, email: str, password: str):
        """
        Valida credenciais e emite o token de acesso.
        Bloqueia o acesso caso a conta não tenha sido validada via OTP.
        """
        user = self.repo.get_by_email(email.lower().strip())
        
        # 1. Verificação de credenciais
        if not user or not verify_password(password, user.password_hash):
            return None
            
        # 2. Regra de Negócio: Impedir login sem ativação prévia
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sua conta ainda não foi ativada. Verifique seu e-mail."
            )
        
        # 3. Construção do Token JWT com Roles (Claims)
        access_token = create_access_token(data={
            "sub": str(user.id), 
            "role": user.role,
            "name": user.name
        })
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "role": user.role
        }

    # ==========================================================================
    # GESTÃO DE PERFIL E SEGURANÇA (SELF-SERVICE)
    # ==========================================================================
    def update_my_profile(self, user_id: int, user_data):
        """Atualiza dados do perfil e garante registro em auditoria."""
        if hasattr(user_data, "email") and user_data.email:
            user_data.email = user_data.email.lower().strip()
            
        updated = self.repo.update(user_id, user_data)
        if updated:
            self.audit_repo.log_action(
                user_id=str(user_id),
                action="UPDATE_SELF",
                table_name="users",
                description="Dados de perfil atualizados pelo próprio usuário."
            )
        return updated

    def change_password(self, user_id: int, current_pwd: str, new_pwd: str):
        """Troca de senha segura com verificação de posse da conta."""
        user = self.repo.get_by_id(user_id)
        if not user or not verify_password(current_pwd, user.password_hash):
            return False
        
        user.password_hash = hash_password(new_pwd)
        self.repo.db.commit()
        
        self.audit_repo.log_action(
            user_id=str(user_id),
            action="CHANGE_PASSWORD",
            table_name="users",
            description="Troca de senha realizada com sucesso."
        )
        return True

    # ==========================================================================
    # OPERAÇÕES ADMINISTRATIVAS (GOVERNANCE)
    # ==========================================================================
    def list_users(self, skip: int = 0, limit: int = 10):
        """Consulta paginada da base de usuários."""
        return self.repo.list(skip=skip, limit=limit)

    def delete_user(self, target_user_id: int, current_user_id: str):
        """
        Desativa usuários. Possui trava de segurança contra auto-exclusão.
        """
        if str(target_user_id) == str(current_user_id):
            return "self_delete_forbidden"
            
        result = self.repo.delete(target_user_id)
        if result:
            self.audit_repo.log_action(
                user_id=str(current_user_id),
                action="DELETE_USER",
                table_name="users",
                description=f"O administrador desativou o usuário ID: {target_user_id}."
            )
        return result