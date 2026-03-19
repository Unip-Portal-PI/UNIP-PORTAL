import random
from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from core.security import hash_password, verify_password, create_access_token
from persistence.repositories.user_repository import UserRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.user_model import UserModel

class AuthService:
    """
    Serviço central de segurança. Gerencia o ciclo de vida do usuário,
    autenticação JWT por matrícula, ativação de conta e auditoria.
    """

    def __init__(self, repo: UserRepository, audit_repo: AuditRepository):
        self.repo = repo
        self.audit_repo = audit_repo

    # ==========================================================================
    # FLUXO DE REGISTRO (COM NOVOS CAMPOS E AUTO-SEED)
    # ==========================================================================
    def register(
        self, 
        name: str, 
        nickname: str,
        registration_number: str, 
        email: str, 
        password: str, 
        area: str,
        phone: Optional[str] = None,
        birth_date: Optional[date] = None,
        admin_id: str = "System"
    ):
        """
        Registra um usuário com os novos campos obrigatórios (nickname, area).
        Se for o primeiro do sistema, torna-o Admin Ativo automaticamente.
        """
        clean_email = email.lower().strip()
        clean_reg = registration_number.strip()
        
        # Validação de duplicidade (E-mail ou Matrícula)
        if self.repo.get_by_email(clean_email) or self.repo.get_by_registration(clean_reg):
            return None
        
        # Regra de Auto-Seed Admin
        is_first_user = self.repo.count_users() == 0
        
        if is_first_user:
            assigned_role = "admin"
            is_active = True  
            otp = None
        else:
            assigned_role = "student"
            is_active = False 
            otp = f"{random.randint(1000, 9999)}"
        
        user = UserModel(
            name=name.strip(),
            nickname=nickname.strip(),
            registration_number=clean_reg,
            email=clean_email,
            password_hash=hash_password(password),
            area=area.strip(),
            phone=phone,
            birth_date=birth_date,
            role=assigned_role,
            is_active=is_active,
            otp_code=otp
        )
        
        created = self.repo.create(user)
        
        if created:
            desc = f"Usuário registrado: {created.registration_number} | {created.email} (Role: {assigned_role})"
            if is_first_user: desc += " - [AUTO-SEED ADMIN]"
                
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="CREATE_USER",
                table_name="users",
                description=desc
            )
        return created

    # ==========================================================================
    # FLUXO DE ATIVAÇÃO
    # ==========================================================================
    def activate_account(self, email: str, otp_code: str):
        """Valida o OTP e ativa a conta para permitir o primeiro login."""
        user = self.repo.get_by_email(email.lower().strip())
        
        if not user or user.otp_code != otp_code:
            return False
            
        user.is_active = True
        user.otp_code = None
        self.repo.db.commit()
        
        self.audit_repo.log_action(
            user_id=str(user.id),
            action="ACTIVATE_ACCOUNT",
            table_name="users",
            description="Conta ativada com sucesso via OTP."
        )
        return True

    # ==========================================================================
    # FLUXO DE LOGIN (VIA MATRÍCULA)
    # ==========================================================================
    def login(self, registration: str, password: str):
        """
        Realiza autenticação utilizando a MATRÍCULA.
        Verifica se a conta está ativa antes de gerar o token.
        """
        user = self.repo.get_by_registration(registration.strip())
        
        if not user or not verify_password(password, user.password_hash):
            return None
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sua conta ainda não foi ativada. Verifique seu e-mail para validar o código OTP."
            )
        
        access_token = create_access_token(data={
            "sub": str(user.id), 
            "role": user.role,
            "name": user.name
        })
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "role": user.role,
            "nickname": user.nickname
        }

    # ==========================================================================
    # RECUPERAÇÃO E SEGURANÇA
    # ==========================================================================
    def request_otp_by_email(self, email: str):
        """Gera um novo OTP para recuperação de senha esquecida."""
        user = self.repo.get_by_email(email.lower().strip())
        if not user: return None
            
        otp = f"{random.randint(1000, 9999)}"
        user.otp_code = otp
        self.repo.db.commit()
        
        self.audit_repo.log_action(
            user_id=str(user.id),
            action="FORGOT_PWD_REQUEST",
            table_name="users",
            description="Solicitado código para recuperação de senha."
        )
        return otp

    def recover_password_with_otp(self, email: str, otp_code: str, new_password: str):
        """Redefine a senha utilizando o fluxo de 'Esqueci minha senha'."""
        user = self.repo.get_by_email(email.lower().strip())
        
        if not user or user.otp_code != otp_code:
            return False
            
        user.password_hash = hash_password(new_password)
        user.otp_code = None
        self.repo.db.commit()
        
        self.audit_repo.log_action(
            user_id=str(user.id),
            action="FORGOT_PWD_RECOVERY",
            table_name="users",
            description="Senha redefinida com sucesso via OTP."
        )
        return True

    # ==========================================================================
    # GESTÃO ADMINISTRATIVA E PERFIL
    # ==========================================================================
    def update_user_access(self, admin_id: int, target_user_id: int, new_role: str) -> str:
        """Promove ou rebaixa o nível de acesso de um usuário (RBAC)."""
        if new_role not in ["student", "staff", "admin"]:
            return "invalid_role"

        success = self.repo.change_user_role(target_user_id, new_role)
        
        if success:
            self.audit_repo.log_action(
                user_id=str(admin_id),
                action="UPDATE_ROLE",
                table_name="users",
                description=f"Nível de acesso do usuário {target_user_id} alterado para {new_role}."
            )
            return "success"
        return "user_not_found"

    def update_my_profile(self, user_id: int, user_data):
        """Atualiza dados do perfil (apelido, área, telefone, etc)."""
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

    def delete_user(self, target_user_id: int, current_user_id: int):
        """Desativa um usuário (Soft Delete). Impede auto-exclusão."""
        if target_user_id == current_user_id:
            return "self_delete_forbidden"
            
        result = self.repo.delete(target_user_id)
        if result:
            self.audit_repo.log_action(
                user_id=str(current_user_id),
                action="DELETE_USER",
                table_name="users",
                description=f"Usuário {target_user_id} desativado pelo administrador."
            )
        return result