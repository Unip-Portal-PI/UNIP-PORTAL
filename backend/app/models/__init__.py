from app.models.anexo import AnexoModel
from app.models.comunicado import ComunicadoModel
from app.models.curso import CursoModel
from app.models.evento import EventoColaborador, EventoCurso, EventoModel, EventoPalestrante
from app.models.evento_cancelamento_aviso import EventoCancelamentoAvisoModel
from app.models.inscricao import InscricaoModel
from app.models.nivel_acesso import NivelAcessoModel
from app.models.palestrante import PalestranteModel
from app.models.presenca import PresencaModel
from app.models.sala import SalaModel
from app.models.usuario import UsuarioModel

__all__ = [
    "AnexoModel",
    "ComunicadoModel",
    "CursoModel",
    "EventoColaborador",
    "EventoCurso",
    "EventoModel",
    "EventoPalestrante",
    "EventoCancelamentoAvisoModel",
    "InscricaoModel",
    "NivelAcessoModel",
    "PalestranteModel",
    "PresencaModel",
    "SalaModel",
    "UsuarioModel",
]
