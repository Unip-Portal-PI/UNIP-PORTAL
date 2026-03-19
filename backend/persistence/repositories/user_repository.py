from sqlalchemy.orm import Session
from persistence.models.user_model import UserModel
from typing import Optional, List

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # CONSULTAS (QUERY ENGINE)
    # ==========================================================================
    def get_by_id(self, user_id: int) -> Optional[UserModel]:
        """Busca usuário pelo ID (independente de estar ativo para permitir reativação)."""
        return self.db.query(UserModel).filter(UserModel.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[UserModel]:
        """Busca usuário por e-mail para verificação de duplicidade e recuperação."""
        return self.db.query(UserModel).filter(UserModel.email == email).first()

    def get_by_registration(self, registration: str) -> Optional[UserModel]:
        """
        MÉTODO CHAVE PARA LOGIN: 
        Busca pela matrícula (RA/Identificador acadêmico).
        """
        return self.db.query(UserModel).filter(UserModel.registration_number == registration).first()

    def list(self, skip: int = 0, limit: int = 100) -> List[UserModel]:
        """Lista usuários ativos para fins administrativos."""
        return self.db.query(UserModel).filter(
            UserModel.is_active == True
        ).offset(skip).limit(limit).all()

    def count_users(self) -> int:
        """
        Conta o total de usuários no banco. 
        Essencial para a regra de Auto-Seed Admin.
        """
        return self.db.query(UserModel).count()

    # ==========================================================================
    # GESTÃO DE CRIAÇÃO
    # ==========================================================================
    def create(self, user: UserModel) -> UserModel:
        """Persiste um novo usuário no banco de dados."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    # ==========================================================================
    # ATUALIZAÇÃO E SEGURANÇA
    # ==========================================================================
    def update(self, user_id: int, user_data) -> Optional[UserModel]:
        """
        Atualiza o perfil do usuário. 
        Suporta os novos campos: nickname, phone, birth_date, area.
        Bloqueia campos sensíveis para evitar escalação de privilégios.
        """
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        # Converte Pydantic para dict se necessário
        data_dict = user_data.model_dump(exclude_unset=True) if hasattr(user_data, "model_dump") else user_data
        
        # Segurança: Campos que nunca podem ser alterados via update comum de perfil
        forbidden_fields = [
            "password", "password_hash", "id", "role", 
            "is_active", "otp_code", "registration_number"
        ]
        
        for key, value in data_dict.items():
            if key not in forbidden_fields and hasattr(user, key):
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def change_user_role(self, user_id: int, new_role: str) -> bool:
        """Método administrativo para alteração de nível de acesso (admin, staff, student)."""
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        user.role = new_role
        self.db.commit()
        return True

    # ==========================================================================
    # EXCLUSÃO E ESTADO (SOFT DELETE)
    # ==========================================================================
    def delete(self, user_id: int) -> bool:
        """
        SOFT DELETE: Desativa o acesso do usuário (is_active=False).
        Mantém os dados para integridade de auditorias e inscrições passadas.
        """
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        user.is_active = False 
        self.db.commit()
        return True

    def reactivate(self, user_id: int) -> bool:
        """Reativa uma conta que foi anteriormente desativada."""
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        user.is_active = True
        self.db.commit()
        return True