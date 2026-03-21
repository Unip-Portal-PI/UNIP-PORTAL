from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token, generate_otp
from app.core.email_service import EmailService
from app.models.usuario import UsuarioModel
from app.models.nivel_acesso import NivelAcessoModel
from app.repositories.usuario_repository import UsuarioRepository
from app.repositories.curso_repository import CursoRepository
from app.schemas.auth import (
    LoginRequest, LoginResponse, UsuarioResumo,
    CadastroRequest, CadastroResponse,
    ResetSolicitarRequest, ResetValidarResponse,
    ResetRedefinirRequest, MensagemResponse,
)


def _build_usuario_resumo(user: UsuarioModel) -> UsuarioResumo:
    return UsuarioResumo(
        id=user.id_usuario,
        nome=user.nome,
        apelido=user.apelido,
        matricula=user.username,
        email=user.email,
        area=user.curso.nome_curso if user.curso else None,
        permission=user.nivel_acesso.nome_perfil,
    )


def login(data: LoginRequest, db: Session) -> LoginResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_username(data.matricula.strip())

    if not user or not verify_password(data.senha, user.password):
        return LoginResponse(sucesso=False, mensagem="Matricula ou senha incorretos.")

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Esta conta esta desativada.",
        )

    token = create_access_token({
        "sub": user.id_usuario,
        "role": user.nivel_acesso.nome_perfil,
    })

    return LoginResponse(
        sucesso=True,
        mensagem="Login realizado com sucesso.",
        token=token,
        usuario=_build_usuario_resumo(user),
    )


def register(data: CadastroRequest, db: Session) -> CadastroResponse:
    repo = UsuarioRepository(db)

    if repo.get_by_username(data.matricula):
        raise HTTPException(status_code=409, detail="Matricula ja cadastrada.")
    if repo.get_by_email(data.email):
        raise HTTPException(status_code=409, detail="E-mail ja cadastrado.")

    curso_repo = CursoRepository(db)
    curso = curso_repo.get_by_nome(data.area)
    if not curso:
        raise HTTPException(status_code=400, detail=f"Curso/area '{data.area}' nao encontrado.")

    nivel_aluno = db.query(NivelAcessoModel).filter(NivelAcessoModel.nome_perfil == "aluno").first()
    if not nivel_aluno:
        raise HTTPException(status_code=500, detail="Nivel de acesso 'aluno' nao configurado no sistema.")

    usuario = UsuarioModel(
        id_nivel=nivel_aluno.id_nivel,
        id_curso=curso.id_curso,
        nome=data.nome,
        apelido=data.apelido,
        username=data.matricula,
        email=data.email,
        password=hash_password(data.senha),
        telefone=data.telefone,
        data_nascimento=data.data_nascimento,
        ativo=True,
    )

    repo.create(usuario)
    return CadastroResponse(sucesso=True, mensagem="Cadastro realizado com sucesso.")


def request_reset(email: str, db: Session) -> MensagemResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_email(email)

    if not user:
        return MensagemResponse(
            sucesso=True,
            mensagem="Se o e-mail estiver cadastrado, voce recebera um codigo de verificacao.",
        )

    otp = generate_otp()
    user.otp_code = hash_password(otp)
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    repo.update(user)

    email_service = EmailService()
    email_service.send_verification_code(user.email, otp)

    return MensagemResponse(
        sucesso=True,
        mensagem="Se o e-mail estiver cadastrado, voce recebera um codigo de verificacao.",
    )


def validate_otp(email: str, codigo: str, db: Session) -> ResetValidarResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_email(email)

    if not user or not user.otp_code:
        raise HTTPException(status_code=400, detail="Codigo invalido ou expirado.")

    if user.otp_expires_at and user.otp_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Codigo expirado. Solicite um novo.")

    if not verify_password(codigo, user.otp_code):
        raise HTTPException(status_code=400, detail="Codigo invalido.")

    user.otp_code = None
    user.otp_expires_at = None
    repo.update(user)

    token = create_access_token(
        {"sub": user.id_usuario, "purpose": "reset"},
        expires_delta=timedelta(minutes=15),
    )

    return ResetValidarResponse(sucesso=True, token_redefinicao=token)


def reset_password(token_redefinicao: str, nova_senha: str, db: Session) -> MensagemResponse:
    from jose import jwt, JWTError
    from app.core.config import settings

    try:
        payload = jwt.decode(token_redefinicao, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        purpose = payload.get("purpose")

        if not user_id or purpose != "reset":
            raise HTTPException(status_code=400, detail="Token de redefinicao invalido.")

    except JWTError:
        raise HTTPException(status_code=400, detail="Token de redefinicao invalido ou expirado.")

    repo = UsuarioRepository(db)
    user = repo.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    user.password = hash_password(nova_senha)
    repo.update(user)

    return MensagemResponse(sucesso=True, mensagem="Senha redefinida com sucesso.")
