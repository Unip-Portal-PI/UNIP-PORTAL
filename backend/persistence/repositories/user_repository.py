from sqlalchemy.orm import Session
from persistence.models.user_model import UserModel
from typing import Optional, List

# ==============================================================================
# REPOSITÓRIO DE USUÁRIOS (IDENTITY & ACCESS MANAGEMENT)
# ==============================================================================
class UserRepository:
    """
    Gerencia a persistência de usuários e perfis de acesso.
    Implementa buscas otimizadas e garante a integridade do Soft Delete.
    """

    def __init__(self, db: Session):
        """Injeta a sessão do banco de dados para operações de I/O."""
        self.db = db

    # ==========================================================================
    # CONSULTAS POR IDENTIFICADORES ÚNICOS
    # ==========================================================================
    def get_by_id(self, user_id: int) -> Optional[UserModel]:
        """Busca usuário pelo ID primário, validando se está ativo."""
        return self.db.query(UserModel).filter(
            UserModel.id == user_id, 
            UserModel.is_active == True
        ).first()

    def get_by_email(self, email: str) -> Optional[UserModel]:
        """Busca usuário pelo e-mail único (utilizado no fluxo de Login)."""
        return self.db.query(UserModel).filter(
            UserModel.email == email, 
            UserModel.is_active == True
        ).first()

    def get_by_registration(self, registration: str) -> Optional[UserModel]:
        """Busca usuário pela matrícula para evitar cadastros duplicados."""
        return self.db.query(UserModel).filter(
            UserModel.registration_number == registration,
            UserModel.is_active == True
        ).first()

    # ==========================================================================
    # GESTÃO DE LISTAGEM E CRIAÇÃO
    # ==========================================================================
    def list(self, skip: int = 0, limit: int = 10) -> List[UserModel]:
        """Retorna uma lista paginada de usuários ativos."""
        return self.db.query(UserModel).filter(
            UserModel.is_active == True
        ).offset(skip).limit(limit).all()

    def create(self, user: UserModel) -> UserModel:
        """Persiste um novo usuário. Commit imediato para garantir o registro."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    # ==========================================================================
    # ATUALIZAÇÃO E CICLO DE VIDA (IDENTITY SECURITY)
    # ==========================================================================
    def update(self, user_id: int, user_data) -> Optional[UserModel]:
        """
        Atualiza o perfil de forma segura. Protege hashes de senha e
        campos críticos de serem sobrescritos indevidamente.
        """
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        # Pydantic V2 model_dump para mapeamento dinâmico
        data_dict = user_data.model_dump(exclude_unset=True)
        
        for key, value in data_dict.items():
            # Bloqueio de segurança: Campos sensíveis protegidos
            if key not in ["password", "password_hash", "id"]: 
                if hasattr(user, key):
                    setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: int) -> bool:
        """
        SOFT DELETE: Revoga o acesso preservando o histórico de auditoria.
        Essencial para manter a consistência de quem realizou ações no passado.
        """
        user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            return False
            
        user.is_active = False 
        self.db.commit()
        return True