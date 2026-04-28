import json
from datetime import date as date_type, datetime, timezone, timedelta

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from app.models.evento import EventoModel, EventoColaborador, EventoCurso, EventoPalestrante
from app.models.anexo import AnexoModel
from app.models.inscricao import InscricaoModel
from app.models.presenca import PresencaModel
from app.models.usuario import UsuarioModel


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

    def list_scroll(
        self,
        skip: int = 0,
        limit: int = 12,
        search: str | None = None,
        area: str | None = None,
        turno: str | None = None,
        data_filtro: date_type | None = None,
        sort: str = "proximos",
        role: str = "aluno",
        include_past: bool = False,
    ) -> tuple[list[EventoModel], int]:
        _BR_TZ = timezone(timedelta(hours=-3))  # UTC-3 (Fortaleza/São Paulo)
        hoje = datetime.now(_BR_TZ).date()

        filters = [
            EventoModel.cancelado.is_(False),
        ]

        if not include_past:
            filters.append(EventoModel.data >= hoje)

        if role == "aluno":
            filters.append(EventoModel.visibilidade == "publica")

        if search:
            s = f"%{search}%"
            filters.append(or_(
                EventoModel.nome.ilike(s),
                EventoModel.descricao_breve.ilike(s),
                EventoModel.descricao.ilike(s),
            ))

        if area:
            filters.append(or_(
                func.json_contains(EventoModel.area, json.dumps(area)),
                func.json_contains(EventoModel.area, json.dumps("Todos")),
            ))

        if turno:
            filters.append(EventoModel.turno == turno)

        if data_filtro:
            filters.append(EventoModel.data == data_filtro)

        # Count without relationships to avoid duplicates
        total = (
            self.db.query(EventoModel.id_evento)
            .filter(*filters)
            .distinct()
            .count()
        )

        # IDs query with correct pagination (no joins from relationships)
        id_q = self.db.query(EventoModel.id_evento).filter(*filters)
        if sort == "recentes":
            id_q = id_q.order_by(EventoModel.data_criacao.desc())
        else:
            id_q = id_q.order_by(EventoModel.data.asc(), EventoModel.data_criacao.desc())

        ids = [row[0] for row in id_q.offset(skip).limit(limit)]
        if not ids:
            return [], total

        # Fetch full objects by IDs (relationships loaded safely without LIMIT)
        items = self._base_query().filter(EventoModel.id_evento.in_(ids)).all()

        order = {id_: i for i, id_ in enumerate(ids)}
        items.sort(key=lambda e: order.get(e.id_evento, 9999))
        return items, total

    def list_by_creator_or_colaborador(self, user_id: str) -> list[EventoModel]:
        return self._base_query().filter(
            or_(
                EventoModel.id_criador == user_id,
                EventoModel.colaboradores.any(UsuarioModel.id_usuario == user_id)
            ),
            EventoModel.cancelado.is_(False),
        ).distinct().all()

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
