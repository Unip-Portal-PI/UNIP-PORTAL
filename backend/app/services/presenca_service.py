from fastapi import HTTPException
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.config import settings
from app.models.presenca import PresencaModel
from app.repositories.inscricao_repository import InscricaoRepository
from app.repositories.presenca_repository import PresencaRepository
from app.schemas.inscricao import InscricaoResponse, PresencaConfirmResponse


def _serialize_inscricao(inscricao) -> InscricaoResponse:
    return InscricaoResponse(
        id=inscricao.id_inscricao,
        evento_id=inscricao.id_evento,
        aluno_id=inscricao.id_usuario,
        aluno_nome=inscricao.usuario.nome,
        aluno_area=inscricao.usuario.curso.nome_curso if inscricao.usuario.curso else None,
        aluno_matricula=inscricao.usuario.username,
        data_inscricao=inscricao.data_inscricao,
        presenca_confirmada=inscricao.presenca is not None,
        qr_code=inscricao.qr_code_usuario,
    )


def _validate_qr_code_token(qr_code: str, inscricao, evento_id: str | None = None) -> None:
    try:
        payload = jwt.decode(qr_code, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return

    if payload.get("type") != "event_checkin":
        raise HTTPException(status_code=400, detail="QR Code invalido para check-in de evento.")

    if payload.get("inscricao_id") != inscricao.id_inscricao:
        raise HTTPException(status_code=400, detail="QR Code nao corresponde a inscricao informada.")

    if payload.get("evento_id") != inscricao.id_evento:
        raise HTTPException(status_code=400, detail="QR Code nao corresponde ao evento informado.")

    if payload.get("usuario_id") != inscricao.id_usuario:
        raise HTTPException(status_code=400, detail="QR Code nao corresponde ao aluno inscrito.")

    if evento_id and inscricao.id_evento != evento_id:
        raise HTTPException(status_code=400, detail="QR Code pertence a outro evento.")


def confirm_presence(
    qr_code: str,
    confirmado_por: str,
    db: Session,
    evento_id: str | None = None,
) -> PresencaConfirmResponse:
    insc_repo = InscricaoRepository(db)
    inscricao = insc_repo.get_by_qr_code(qr_code)

    if not inscricao:
        raise HTTPException(status_code=404, detail="QR Code invalido ou inscricao nao encontrada.")

    if evento_id and inscricao.id_evento != evento_id:
        raise HTTPException(status_code=400, detail="QR Code pertence a outro evento.")

    _validate_qr_code_token(qr_code, inscricao, evento_id)

    presenca_repo = PresencaRepository(db)
    if presenca_repo.exists(inscricao.id_inscricao):
        raise HTTPException(status_code=409, detail="Presenca ja confirmada para esta inscricao.")

    presenca = PresencaModel(
        id_inscricao=inscricao.id_inscricao,
        confirmado_por=confirmado_por,
    )
    presenca_repo.create(presenca)

    inscricao = insc_repo.get_by_qr_code(qr_code)

    return PresencaConfirmResponse(
        sucesso=True,
        mensagem="Presenca confirmada com sucesso.",
        inscricao=_serialize_inscricao(inscricao),
    )
