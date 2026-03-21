import random
from datetime import date
from typing import Optional
from fastapi import HTTPException, status
from core.security import hash_password, verify_password, create_access_token
from persistence.repositories.user_repository import UserRepository
from persistence.repositories.audit_repository import AuditRepository
from persistence.models.user_model import UserModel
from business.services.email_service import EmailService

class AuthService:
    """
    Serviço central de segurança. Gerencia o ciclo de vida do usuário,
    autenticação JWT por matrícula, ativação de conta e auditoria.
    """

    def __init__(self, repo: UserRepository, audit_repo: AuditRepository, email_service: EmailService):
        self.repo = repo
        self.audit_repo = audit_repo
        self.email_service = email_service

    # ==========================================================================
    # FLUXO DE REGISTRO
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
        clean_email = email.lower().strip()
        clean_reg = registration_number.strip()
        
        if self.repo.get_by_email(clean_email) or self.repo.get_by_registration(clean_reg):
            return None
        
        is_first_user = self.repo.count_users() == 0
        
        if is_first_user:
            assigned_role = "admin"
            is_active = True  
            otp = None
        else:
            assigned_role = "student"
            is_active = False 
            otp = f"{random.randint(100000, 999999)}" 
        
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
            if otp:
                self.email_service.send_verification_code(created.email, otp)

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
    # FLUXO DE ATIVAÇÃO E LOGIN
    # ==========================================================================
    def activate_account(self, email: str, otp_code: str):
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

    def login(self, registration: str, password: str):
        user = self.repo.get_by_registration(registration.strip())
        
        if not user or not verify_password(password, user.password_hash):
            return None
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sua conta ainda não foi ativada. Verifique seu e-mail."
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
    # RECUPERAÇÃO DE SENHA (NÃO LOGADO)
    # ==========================================================================
    def request_otp_by_email(self, email: str):
        user = self.repo.get_by_email(email.lower().strip())
        if not user: return None
            
        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        self.repo.db.commit()
        
        self.email_service.send_verification_code(user.email, otp)
        
        self.audit_repo.log_action(
            user_id=str(user.id),
            action="FORGOT_PWD_REQUEST",
            table_name="users",
            description="Solicitado código para recuperação de senha."
        )
        return otp

    def recover_password_with_otp(self, email: str, otp_code: str, new_password: str):
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
    # TROCA DE SENHA (USUÁRIO LOGADO) - NOVOS MÉTODOS
    # ==========================================================================
    def request_password_change_otp(self, user_id: int) -> bool:
        """Gera e envia um código para troca de senha do usuário que já está logado."""
        user = self.repo.get_by_id(user_id)
        if not user:
            return False

        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        self.repo.db.commit()

        # Dispara e-mail com o layout do AVP Conecta
        self.email_service.send_verification_code(user.email, otp)

        self.audit_repo.log_action(
            user_id=str(user.id),
            action="PWD_CHANGE_REQUEST",
            table_name="users",
            description="Solicitado código para alteração de senha via perfil logado."
        )
        return True

    def confirm_password_change(self, user_id: int, otp_code: str, new_password: str) -> bool:
        """Valida o código e aplica a nova senha para o usuário logado."""
        user = self.repo.get_by_id(user_id)
        
        if not user or user.otp_code != otp_code:
            return False
            
        user.password_hash = hash_password(new_password)
        user.otp_code = None
        self.repo.db.commit()
        
        self.audit_repo.log_action(
            user_id=str(user.id),
            action="PWD_CHANGE_CONFIRM",
            table_name="users",
            description="Senha alterada com sucesso dentro do perfil."
        )
        return True

    # ==========================================================================
    # GESTÃO ADMINISTRATIVA E PERFIL
    # ==========================================================================
    def update_user_access(self, admin_id: int, target_user_id: int, new_role: str) -> str:
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