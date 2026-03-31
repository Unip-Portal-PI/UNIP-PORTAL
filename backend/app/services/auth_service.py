from datetime import datetime, timedelta, timezone
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token, generate_otp
from app.core.email_service import EmailService
from app.models.evento_cancelamento_aviso import EventoCancelamentoAvisoModel
from app.models.usuario import UsuarioModel
from app.models.nivel_acesso import NivelAcessoModel
from app.repositories.usuario_repository import UsuarioRepository
from app.repositories.curso_repository import CursoRepository
from app.schemas.auth import (
    EventoCanceladoResumo,
    LoginRequest, LoginResponse, UsuarioResumo,
    CadastroRequest, CadastroResponse,
    ResetSolicitarRequest, ResetPreviewResponse, ResetValidarResponse,
    ResetRedefinirRequest, MensagemResponse,
)

logger = logging.getLogger("app.auth")


def _mask_email(email: str) -> str:
    try:
        local, domain = email.split("@", 1)
    except ValueError:
        return "***"
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[:2] + "*" * max(2, len(local) - 2)
    return f"{masked_local}@{domain}"


def _build_usuario_resumo(user: UsuarioModel) -> UsuarioResumo:
    return UsuarioResumo(
        id=user.id_usuario,
        nome=user.nome,
        apelido=user.apelido,
        matricula=user.username,
        email=user.email,
        area=user.curso.nome_curso if user.curso else None,
        foto_url=user.foto_url,
        permission=user.nivel_acesso.nome_perfil,
    )


def _consume_cancelled_events(user_id: str, db: Session) -> list[EventoCanceladoResumo]:
    avisos = (
        db.query(EventoCancelamentoAvisoModel)
        .filter(
            EventoCancelamentoAvisoModel.id_usuario == user_id,
            EventoCancelamentoAvisoModel.visualizado_em.is_(None),
        )
        .order_by(EventoCancelamentoAvisoModel.criado_em.asc())
        .all()
    )

    if not avisos:
        return []

    visualizado_em = datetime.now(timezone.utc)
    eventos_cancelados = []

    for aviso in avisos:
        aviso.visualizado_em = visualizado_em
        eventos_cancelados.append(
            EventoCanceladoResumo(
                evento_id=aviso.id_evento,
                nome=aviso.evento_nome,
                data=aviso.evento_data,
            )
        )

    db.commit()
    return eventos_cancelados


def login(data: LoginRequest, db: Session) -> LoginResponse:
    repo = UsuarioRepository(db)
    login_value = data.matricula.strip()
    logger.info("login_attempt value=%s", login_value)
    user = repo.get_by_username(login_value)
    found_by = "username"

    # Allow login using either matricula (username) or e-mail.
    if not user and "@" in login_value:
        user = repo.get_by_email(login_value)
        found_by = "email"

    if not user or not verify_password(data.senha, user.password):
        logger.warning("login_failure value=%s reason=invalid_credentials", login_value)
        return LoginResponse(sucesso=False, mensagem="Matricula ou senha incorretos.")

    if not user.ativo:
        logger.warning(
            "login_failure user_id=%s value=%s reason=inactive_account",
            user.id_usuario,
            login_value,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Esta conta esta desativada.",
        )

    token = create_access_token({
        "sub": user.id_usuario,
        "role": user.nivel_acesso.nome_perfil,
    })

    logger.info(
        "login_success user_id=%s value=%s matched_by=%s role=%s",
        user.id_usuario,
        login_value,
        found_by,
        user.nivel_acesso.nome_perfil,
    )

    return LoginResponse(
        sucesso=True,
        mensagem="Login realizado com sucesso.",
        token=token,
        usuario=_build_usuario_resumo(user),
        eventos_cancelados=_consume_cancelled_events(user.id_usuario, db),
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


def request_reset(matricula: str, email: str, db: Session) -> MensagemResponse:
    from app.core.config import settings

    repo = UsuarioRepository(db)
    matricula_norm = matricula.strip()
    email_norm = email.strip().lower()
    user = repo.get_by_username(matricula_norm)
    logger.info(
        "request_reset matricula=%s email=%s user_found=%s",
        matricula_norm,
        email_norm,
        bool(user),
    )

    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado para a matricula informada.")

    if user.email.strip().lower() != email_norm:
        raise HTTPException(status_code=400, detail="E-mail nao corresponde ao usuario informado.")

    otp = generate_otp()
    user.otp_code = hash_password(otp)
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRATION_MINUTES)
    repo.update(user)
    logger.info("request_reset_otp_saved user_id=%s email=%s", user.id_usuario, user.email)

    email_service = EmailService()
    sent = email_service.send_verification_code(user.email, otp)
    if not sent:
        raise HTTPException(
            status_code=500,
            detail="Nao foi possivel enviar o e-mail de recuperacao. Verifique as credenciais do provedor.",
        )

    return MensagemResponse(
        sucesso=True,
        mensagem="Codigo de verificacao enviado para o e-mail informado.",
    )


def preview_reset_target_by_matricula(matricula: str, db: Session) -> ResetPreviewResponse:
    repo = UsuarioRepository(db)
    matricula_norm = matricula.strip()
    user = repo.get_by_username(matricula_norm)
    logger.info("preview_reset_target matricula=%s user_found=%s", matricula_norm, bool(user))

    if not user:
        raise HTTPException(status_code=404, detail="Nenhum usuario encontrado para esta matricula.")

    return ResetPreviewResponse(
        sucesso=True,
        mensagem="Usuario encontrado para recuperacao.",
        matricula=user.username,
        email_preview=_mask_email(user.email),
    )


def validate_otp(email: str, codigo: str, db: Session) -> ResetValidarResponse:
    repo = UsuarioRepository(db)
    user = repo.get_by_email(email)
    logger.info("validate_otp email=%s user_found=%s", email, bool(user))

    if not user or not user.otp_code:
        raise HTTPException(status_code=400, detail="Codigo invalido ou expirado.")

    if user.otp_expires_at:
        expires_at = user.otp_expires_at
        now_utc = datetime.now(timezone.utc)
        if expires_at.tzinfo is None:
            now_ref = now_utc.replace(tzinfo=None)
        else:
            now_ref = now_utc

        if expires_at < now_ref:
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
    logger.info("validate_otp_success user_id=%s email=%s", user.id_usuario, user.email)

    return ResetValidarResponse(sucesso=True, token_redefinicao=token)


def reset_password(token_redefinicao: str, nova_senha: str, db: Session) -> MensagemResponse:
    from jose import jwt, JWTError
    from app.core.config import settings

    try:
        payload = jwt.decode(token_redefinicao, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        purpose = payload.get("purpose")
        logger.info("reset_password_token_decoded sub=%s purpose=%s", user_id, purpose)

        if not user_id or purpose != "reset":
            raise HTTPException(status_code=400, detail="Token de redefinicao invalido.")

    except JWTError:
        raise HTTPException(status_code=400, detail="Token de redefinicao invalido ou expirado.")

    repo = UsuarioRepository(db)
    user = repo.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

    logger.info("reset_password_attempt user_id=%s", user.id_usuario)

    if verify_password(nova_senha, user.password):
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ser diferente da senha atual.",
        )

    previous_hash = user.password
    new_hash = hash_password(nova_senha)
    updated_rows = (
        db.query(UsuarioModel)
        .filter(UsuarioModel.id_usuario == user_id)
        .update({UsuarioModel.password: new_hash}, synchronize_session=False)
    )
    db.commit()

    if updated_rows != 1:
        logger.error(
            "reset_password_failed user_id=%s reason=unexpected_rowcount rowcount=%s",
            user_id,
            updated_rows,
        )
        raise HTTPException(
            status_code=500,
            detail="Nao foi possivel atualizar a senha. Tente novamente.",
        )

    db.expire_all()
    reloaded_user = repo.get_by_id(user_id)
    logger.info(
        "reset_password_post_update user_id=%s rowcount=%s hash_changed=%s",
        user_id,
        updated_rows,
        bool(reloaded_user and reloaded_user.password != previous_hash),
    )
    if not reloaded_user or not verify_password(nova_senha, reloaded_user.password):
        logger.error("reset_password_failed user_id=%s reason=password_not_persisted", user_id)
        raise HTTPException(
            status_code=500,
            detail="Nao foi possivel atualizar a senha. Tente novamente.",
        )

    logger.info("reset_password_success user_id=%s", user.id_usuario)
    return MensagemResponse(sucesso=True, mensagem="Senha redefinida com sucesso.")
