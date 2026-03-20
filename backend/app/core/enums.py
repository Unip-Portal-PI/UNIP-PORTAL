from enum import StrEnum


class Turno(StrEnum):
    MANHA = "manha"
    TARDE = "tarde"
    NOITE = "noite"


class TipoInscricao(StrEnum):
    INTERNA = "interna"
    EXTERNA = "externa"


class Visibilidade(StrEnum):
    PUBLICA = "publica"
    PRIVADA = "privada"
