from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.presenca import PresencaModel
from app.repositories.inscricao_repository import InscricaoRepository
from app.repositories.presenca_repository import PresencaRepository
from app.schemas.inscricao import InscricaoResponse, PresencaConfirmResponse


def confirm_presence(qr_code: str, confirmado_por: str, db: Session) -> PresencaConfirmResponse:
    insc_repo = InscricaoRepository(db)
    inscricao = insc_repo.get_by_qr_code(qr_code)

    if not inscricao:
        raise HTTPException(status_code=404, detail="QR Code invalido ou inscricao nao encontrada.")

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
        inscricao=InscricaoResponse(
            id=inscricao.id_inscricao,
            evento_id=inscricao.id_evento,
            aluno_id=inscricao.id_usuario,
            aluno_nome=inscricao.usuario.nome,
            aluno_area=inscricao.usuario.curso.nome_curso if inscricao.usuario.curso else None,
            aluno_matricula=inscricao.usuario.username,
            data_inscricao=inscricao.data_inscricao,
            presenca_confirmada=True,
            qr_code=inscricao.qr_code_usuario,
        ),
    )
