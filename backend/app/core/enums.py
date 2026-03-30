from enum import StrEnum


class Turno(StrEnum):
    manha = "manha"
    tarde = "tarde"
    noite = "noite"


class TipoInscricao(StrEnum):
    interna = "interna"
    externa = "externa"


class Visibilidade(StrEnum):
    publica = "publica"
    privada = "privada"
