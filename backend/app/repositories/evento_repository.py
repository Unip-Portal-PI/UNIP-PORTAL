from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.evento import EventoModel, EventoColaborador, EventoCurso, EventoPalestrante
from app.models.anexo import AnexoModel
from app.models.inscricao import InscricaoModel
from app.models.presenca import PresencaModel


class EventoRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(EventoModel).options(
            joinedload(EventoModel.cursos),
            joinedload(EventoModel.palestrantes),
            joinedload(EventoModel.colaboradores),
            joinedload(EventoModel.anexos),
        )

    def list_all(self) -> list[EventoModel]:
        return self._base_query().filter(EventoModel.cancelado.is_(False)).all()

    def list_by_creator(self, creator_id: str) -> list[EventoModel]:
        return self._base_query().filter(
            EventoModel.id_criador == creator_id,
            EventoModel.cancelado.is_(False),
        ).all()

    def get_by_id(self, evento_id: str, include_cancelled: bool = False) -> EventoModel | None:
        query = self._base_query().filter(EventoModel.id_evento == evento_id)
        if not include_cancelled:
            query = query.filter(EventoModel.cancelado.is_(False))
        return query.first()

    def create(self, evento: EventoModel) -> EventoModel:
        self.db.add(evento)
        self.db.commit()
        self.db.refresh(evento)
        return evento

    def update(self, evento: EventoModel) -> EventoModel:
        self.db.commit()
        self.db.refresh(evento)
        return evento

    def delete(self, evento: EventoModel) -> None:
        self.db.delete(evento)
        self.db.commit()

    def clear_event_enrollments(self, evento_id: str) -> int:
        inscricoes = self.db.query(InscricaoModel).filter(
            InscricaoModel.id_evento == evento_id
        ).all()

        for inscricao in inscricoes:
            # Remove presenca explicitamente antes da inscricao para evitar
            # tentativa do ORM de nullificar id_inscricao (NOT NULL).
            self.db.query(PresencaModel).filter(
                PresencaModel.id_inscricao == inscricao.id_inscricao
            ).delete(synchronize_session=False)
            inscricao.qr_code_usuario = None
            self.db.flush()
            self.db.delete(inscricao)

        return len(inscricoes)

    def list_event_enrollments(self, evento_id: str) -> list[InscricaoModel]:
        return self.db.query(InscricaoModel).filter(
            InscricaoModel.id_evento == evento_id
        ).all()

    def count_inscricoes(self, evento_id: str) -> int:
        return self.db.query(func.count(InscricaoModel.id_inscricao)).filter(
            InscricaoModel.id_evento == evento_id
        ).scalar() or 0

    def set_cursos(self, evento_id: str, cursos_ids: list[str]) -> None:
        self.db.query(EventoCurso).filter(EventoCurso.id_evento == evento_id).delete()
        for curso_id in cursos_ids:
            self.db.add(EventoCurso(id_evento=evento_id, id_curso=curso_id))

    def set_palestrantes(self, evento_id: str, palestrantes_ids: list[str]) -> None:
        self.db.query(EventoPalestrante).filter(EventoPalestrante.id_evento == evento_id).delete()
        for palestrante_id in palestrantes_ids:
            self.db.add(EventoPalestrante(id_evento=evento_id, id_palestrante=palestrante_id))

    def set_colaboradores(self, evento_id: str, usuarios_ids: list[str]) -> None:
        self.db.query(EventoColaborador).filter(EventoColaborador.id_evento == evento_id).delete()
        for usuario_id in usuarios_ids:
            self.db.add(EventoColaborador(id_evento=evento_id, id_usuario=usuario_id))

    def set_anexos(self, evento_id: str, anexos: list[dict]) -> None:
        self.db.query(AnexoModel).filter(AnexoModel.id_evento == evento_id).delete()
        for anexo in anexos:
            self.db.add(
                AnexoModel(
                    id_evento=evento_id,
                    nome=anexo["nome"],
                    url=anexo["url"],
                )
            )
