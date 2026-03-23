from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.storage import build_file_url, extract_file_path
from app.models.comunicado import ComunicadoModel
from app.models.usuario import UsuarioModel
from app.repositories.comunicado_repository import ComunicadoRepository
from app.schemas.comunicado import (
    ComunicadoCreateRequest,
    ComunicadoResponse,
    ComunicadoUpdateRequest,
)


def _serialize(comunicado: ComunicadoModel) -> ComunicadoResponse:
    anexos = []
    for anexo in comunicado.anexos or []:
        serialized = dict(anexo)
        serialized["url"] = build_file_url(serialized.get("url")) or serialized.get("url")
        anexos.append(serialized)

    return ComunicadoResponse(
        id=comunicado.id_comunicado,
        titulo=comunicado.titulo,
        assunto=comunicado.assunto,
        conteudo=comunicado.conteudo,
        resumo=comunicado.resumo,
        banner=build_file_url(comunicado.banner_url),
        visibilidade=comunicado.visibilidade or [],
        anexos=anexos,
        data_validade=comunicado.data_validade,
        criado_em=comunicado.data_criacao,
        criado_por=comunicado.criador.username,
        criado_por_nome=comunicado.criador.nome,
        removido=comunicado.removido,
    )


def _normalize_anexos(anexos):
    normalized_anexos = []
    for anexo in anexos or []:
        normalized = anexo.model_dump(by_alias=False) if hasattr(anexo, "model_dump") else dict(anexo)
        normalized["url"] = extract_file_path(normalized.get("url"))
        normalized_anexos.append(normalized)
    return normalized_anexos


def _can_view(comunicado: ComunicadoModel, current_user: UsuarioModel) -> bool:
    if comunicado.removido:
        return False

    role = current_user.nivel_acesso.nome_perfil
    if role in {"adm", "colaborador"}:
        return True

    visibilidade = comunicado.visibilidade or []
    if "Todos" in visibilidade:
        return True

    area = current_user.curso.nome_curso if current_user.curso else None
    return area in visibilidade if area else False


def list_announcements(current_user: UsuarioModel, db: Session) -> list[ComunicadoResponse]:
    comunicados = ComunicadoRepository(db).list_all()
    visibles = [c for c in comunicados if _can_view(c, current_user)]
    return [_serialize(c) for c in visibles]


def list_my_announcements(current_user: UsuarioModel, db: Session) -> list[ComunicadoResponse]:
    comunicados = ComunicadoRepository(db).list_by_creator(current_user.id_usuario)
    comunicados = [c for c in comunicados if not c.removido]
    return [_serialize(c) for c in comunicados]


def get_announcement(comunicado_id: str, current_user: UsuarioModel, db: Session) -> ComunicadoResponse:
    comunicado = ComunicadoRepository(db).get_by_id(comunicado_id)
    if not comunicado or not _can_view(comunicado, current_user):
        raise HTTPException(status_code=404, detail="Comunicado nao encontrado.")
    return _serialize(comunicado)


def create_announcement(
    data: ComunicadoCreateRequest,
    current_user: UsuarioModel,
    db: Session,
) -> ComunicadoResponse:
    comunicado = ComunicadoModel(
        titulo=data.titulo,
        assunto=data.assunto,
        conteudo=data.conteudo,
        resumo=data.resumo,
        banner_url=extract_file_path(data.banner),
        visibilidade=data.visibilidade,
        anexos=_normalize_anexos(data.anexos),
        data_validade=data.data_validade,
        id_criador=current_user.id_usuario,
    )
    comunicado = ComunicadoRepository(db).create(comunicado)
    return _serialize(ComunicadoRepository(db).get_by_id(comunicado.id_comunicado))


def update_announcement(
    comunicado_id: str,
    data: ComunicadoUpdateRequest,
    current_user: UsuarioModel,
    db: Session,
) -> ComunicadoResponse:
    repo = ComunicadoRepository(db)
    comunicado = repo.get_by_id(comunicado_id)
    if not comunicado or comunicado.removido:
        raise HTTPException(status_code=404, detail="Comunicado nao encontrado.")

    role = current_user.nivel_acesso.nome_perfil
    if role != "adm" and comunicado.id_criador != current_user.id_usuario:
        raise HTTPException(status_code=403, detail="Sem permissao para editar este comunicado.")

    update_data = data.model_dump(exclude_unset=True, by_alias=False)
    if "banner" in update_data:
        comunicado.banner_url = extract_file_path(update_data.pop("banner"))
    if "anexos" in update_data and update_data["anexos"] is not None:
        comunicado.anexos = _normalize_anexos(update_data.pop("anexos"))
    for field, value in update_data.items():
        setattr(comunicado, field, value)

    repo.update(comunicado)
    return _serialize(repo.get_by_id(comunicado_id))


def delete_announcement(comunicado_id: str, current_user: UsuarioModel, db: Session) -> None:
    repo = ComunicadoRepository(db)
    comunicado = repo.get_by_id(comunicado_id)
    if not comunicado or comunicado.removido:
        raise HTTPException(status_code=404, detail="Comunicado nao encontrado.")

    role = current_user.nivel_acesso.nome_perfil
    if role != "adm" and comunicado.id_criador != current_user.id_usuario:
        raise HTTPException(status_code=403, detail="Sem permissao para excluir este comunicado.")

    comunicado.removido = True
    repo.update(comunicado)
