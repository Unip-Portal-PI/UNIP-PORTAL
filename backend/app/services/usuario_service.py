from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.nivel_acesso import NivelAcessoModel
from app.models.usuario import UsuarioModel
from app.repositories.curso_repository import CursoRepository
from app.repositories.usuario_repository import UsuarioRepository
from app.schemas.usuario import (
    MensagemResponse,
    UsuarioAdminCreateRequest,
    UsuarioAdminResponse,
    UsuarioAdminUpdateRequest,
    UsuarioPerfilResponse,
    UsuarioResumoResponse,
    UsuarioUpdateMeRequest,
)


def _serialize_profile(user: UsuarioModel) -> UsuarioPerfilResponse:
    return UsuarioPerfilResponse(
        id=user.id_usuario,
        nome=user.nome,
        apelido=user.apelido,
        matricula=user.username,
        email=user.email,
        area=user.curso.nome_curso if user.curso else None,
        permission=user.nivel_acesso.nome_perfil,
        foto_url=user.foto_url,
        telefone=user.telefone,
        data_nascimento=user.data_nascimento,
        ativo=user.ativo,
        criado_em=user.data_criacao,
        atualizado_em=user.data_atualizacao,
    )


def _serialize_admin(user: UsuarioModel) -> UsuarioAdminResponse:
    criado_por = user.criador.username if user.criador else None
    return UsuarioAdminResponse(
        id=user.id_usuario,
        nome=user.nome,
        apelido=user.apelido,
        matricula=user.username,
        email=user.email,
        area=user.curso.nome_curso if user.curso else None,
        permission=user.nivel_acesso.nome_perfil,
        foto_url=user.foto_url,
        ativo=user.ativo,
        deleted_at=user.deleted_at,
        criado_em=user.data_criacao,
        atualizado_em=user.data_atualizacao,
        criado_por=criado_por,
    )


def _resolve_curso(area: str, db: Session):
    curso_repo = CursoRepository(db)
    curso = curso_repo.get_by_nome(area)
    if not curso:
        raise HTTPException(status_code=400, detail=f"Curso/area '{area}' nao encontrado.")
    return curso


def _resolve_nivel(permission: str, db: Session):
    nivel = db.query(NivelAcessoModel).filter(
        NivelAcessoModel.nome_perfil == permission
    ).first()
    if not nivel:
        raise HTTPException(status_code=400, detail="Perfil de acesso invalido.")
    return nivel


def get_me(current_user: UsuarioModel) -> UsuarioPerfilResponse:
    return _serialize_profile(current_user)


def list_active_collaborators(db: Session) -> list[UsuarioResumoResponse]:
    users = UsuarioRepository(db).list_active_collaborators()
    return [
        UsuarioResumoResponse(
            id=user.id_usuario,
            nome=user.nome,
            apelido=user.apelido,
            matricula=user.username,
            email=user.email,
            area=user.curso.nome_curso if user.curso else None,
            permission=user.nivel_acesso.nome_perfil,
        )
        for user in users
    ]


def update_me(data: UsuarioUpdateMeRequest, current_user: UsuarioModel, db: Session) -> UsuarioPerfilResponse:
    repo = UsuarioRepository(db)

    existing_email = repo.get_by_email(data.email)
    if existing_email and existing_email.id_usuario != current_user.id_usuario:
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado.")

    curso = _resolve_curso(data.area, db)

    current_user.nome = data.nome
    current_user.apelido = data.apelido
    current_user.email = data.email
    current_user.telefone = data.telefone
    current_user.data_nascimento = data.data_nascimento
    current_user.id_curso = curso.id_curso

    repo.update(current_user)
    user = repo.get_by_id(current_user.id_usuario)
    return _serialize_profile(user)


def update_my_password(
    senha_atual: str,
    nova_senha: str,
    current_user: UsuarioModel,
    db: Session,
) -> MensagemResponse:
    if not verify_password(senha_atual, current_user.password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")

    current_user.password = hash_password(nova_senha)
    UsuarioRepository(db).update(current_user)
    return MensagemResponse(sucesso=True, mensagem="Senha atualizada com sucesso.")


def update_my_photo(foto_url: str | None, current_user: UsuarioModel, db: Session) -> UsuarioPerfilResponse:
    current_user.foto_url = foto_url
    UsuarioRepository(db).update(current_user)
    user = UsuarioRepository(db).get_by_id(current_user.id_usuario)
    return _serialize_profile(user)


def list_users(db: Session) -> list[UsuarioAdminResponse]:
    users = UsuarioRepository(db).list_all()
    return [_serialize_admin(user) for user in users]


def get_user(user_id: str, db: Session) -> UsuarioAdminResponse:
    user = UsuarioRepository(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    return _serialize_admin(user)


def create_user(data: UsuarioAdminCreateRequest, creator_id: str, db: Session) -> UsuarioAdminResponse:
    repo = UsuarioRepository(db)

    if repo.get_by_username(data.matricula):
        raise HTTPException(status_code=409, detail="Matricula ja cadastrada.")
    if repo.get_by_email(data.email):
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado.")

    curso = _resolve_curso(data.area, db)
    nivel = _resolve_nivel(data.permission, db)

    user = UsuarioModel(
        id_nivel=nivel.id_nivel,
        id_curso=curso.id_curso,
        nome=data.nome,
        apelido=data.apelido,
        username=data.matricula,
        email=data.email,
        password=hash_password(data.senha),
        ativo=data.ativo,
        id_criador=creator_id,
        deleted_at=None,
    )
    user = repo.create(user)
    return _serialize_admin(repo.get_by_id(user.id_usuario))


def update_user(user_id: str, data: UsuarioAdminUpdateRequest, db: Session) -> UsuarioAdminResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    if data.email:
        existing_email = repo.get_by_email(data.email)
        if existing_email and existing_email.id_usuario != user_id:
            raise HTTPException(status_code=409, detail="E-mail ja cadastrado.")
        user.email = data.email

    if data.nome is not None:
        user.nome = data.nome
    if data.apelido is not None:
        user.apelido = data.apelido
    if data.area is not None:
        curso = _resolve_curso(data.area, db)
        user.id_curso = curso.id_curso
    if data.permission is not None:
        nivel = _resolve_nivel(data.permission, db)
        user.id_nivel = nivel.id_nivel
    if data.ativo is not None:
        user.ativo = data.ativo

    repo.update(user)
    return _serialize_admin(repo.get_by_id(user.id_usuario))


def delete_user(user_id: str, current_user: UsuarioModel, db: Session) -> MensagemResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    if user.id_usuario == current_user.id_usuario:
        raise HTTPException(status_code=400, detail="Voce nao pode excluir sua propria conta.")

    if user.nivel_acesso.nome_perfil == "adm":
        raise HTTPException(status_code=400, detail="Nao e permitido excluir administradores.")

    user.deleted_at = datetime.now(timezone.utc)
    user.ativo = False
    repo.update(user)
    return MensagemResponse(sucesso=True, mensagem="Usuario excluido com sucesso.")


def restore_user(user_id: str, db: Session) -> MensagemResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    user.deleted_at = None
    user.ativo = True
    repo.update(user)
    return MensagemResponse(sucesso=True, mensagem="Usuario restaurado com sucesso.")
