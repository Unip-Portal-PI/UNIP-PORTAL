from sqlalchemy.orm import Session, joinedload
from app.models.usuario import UsuarioModel


class UsuarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(UsuarioModel).options(
            joinedload(UsuarioModel.nivel_acesso),
            joinedload(UsuarioModel.curso),
        )

    def get_by_id(self, user_id: str) -> UsuarioModel | None:
        return self._base_query().filter(UsuarioModel.id_usuario == user_id).first()

    def get_by_username(self, username: str) -> UsuarioModel | None:
        return self._base_query().filter(UsuarioModel.username == username).first()

    def get_by_email(self, email: str) -> UsuarioModel | None:
        return self._base_query().filter(UsuarioModel.email == email).first()

    def create(self, usuario: UsuarioModel) -> UsuarioModel:
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def update(self, usuario: UsuarioModel) -> UsuarioModel:
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def list_all(self) -> list[UsuarioModel]:
        return self._base_query().all()
