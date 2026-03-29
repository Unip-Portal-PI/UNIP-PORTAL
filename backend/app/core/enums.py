from enum import StrEnum


class Turno(StrEnum):
    MANHA = "MANHA"
    TARDE = "TARDE"
    NOITE = "NOITE"


class TipoInscricao(StrEnum):
    INTERNA = "INTERNA"
    EXTERNA = "EXTERNA"


class Visibilidade(StrEnum):
    PUBLICA = "PUBLICA"
    PRIVADA = "PRIVADA"
