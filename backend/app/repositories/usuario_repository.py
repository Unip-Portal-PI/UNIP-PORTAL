from sqlalchemy import asc, case, desc, or_, select
from sqlalchemy.orm import Session, joinedload
from app.models.nivel_acesso import NivelAcessoModel
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

    def list_paginated(
        self,
        pagina: int = 1,
        por_pagina: int = 10,
        search: str | None = None,
        permission: str | None = None,
        status: str | None = None,
        sort_by: str | None = None,
        sort_dir: str = "asc",
    ) -> tuple[list[UsuarioModel], int]:
        query = self.db.query(UsuarioModel)

        if status == "ativos":
            query = query.filter(UsuarioModel.ativo.is_(True), UsuarioModel.deleted_at.is_(None))
        elif status == "inativos":
            query = query.filter(UsuarioModel.ativo.is_(False), UsuarioModel.deleted_at.is_(None))
        elif status == "excluidos":
            query = query.filter(UsuarioModel.deleted_at.isnot(None))

        if permission:
            query = query.filter(
                UsuarioModel.nivel_acesso.has(NivelAcessoModel.nome_perfil == permission)
            )

        if search:
            s = f"%{search}%"
            query = query.filter(
                or_(
                    UsuarioModel.nome.ilike(s),
                    UsuarioModel.email.ilike(s),
                    UsuarioModel.username.ilike(s),
                )
            )

        total = query.count()

        order_fn = desc if sort_dir == "desc" else asc
        if sort_by == "nome":
            query = query.order_by(order_fn(UsuarioModel.nome))
        elif sort_by == "email":
            query = query.order_by(order_fn(UsuarioModel.email))
        elif sort_by == "matricula":
            query = query.order_by(order_fn(UsuarioModel.username))
        elif sort_by == "permission":
            nivel_sub = select(NivelAcessoModel.nome_perfil).where(
                NivelAcessoModel.id_nivel == UsuarioModel.id_nivel
            ).scalar_subquery()
            query = query.order_by(order_fn(nivel_sub))
        elif sort_by == "status":
            status_expr = case(
                (UsuarioModel.deleted_at.isnot(None), 2),
                (UsuarioModel.ativo.is_(True), 0),
                else_=1,
            )
            query = query.order_by(order_fn(status_expr))
        else:
            query = query.order_by(UsuarioModel.nome)

        items = query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()
        return items, total

    def list_active_collaborators(self) -> list[UsuarioModel]:
        return self._base_query().filter(
            UsuarioModel.ativo.is_(True),
            UsuarioModel.deleted_at.is_(None),
            UsuarioModel.nivel_acesso.has(nome_perfil="colaborador"),
        ).all()
