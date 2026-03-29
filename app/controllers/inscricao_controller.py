import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleChecker
from app.schemas.inscricao import PresencaConfirmRequest, PresencaConfirmResponse
from app.services import presenca_service

router = APIRouter(prefix="/enrollments", tags=["Inscricoes"])
logger = logging.getLogger("app.inscricoes")

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])


@router.post("/confirm-presence", response_model=PresencaConfirmResponse)
def confirm_presence(
    data: PresencaConfirmRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        result = presenca_service.confirm_presence(data.qr_code, current_user.id_usuario, db)
        logger.info("confirm_presence_success user_id=%s", current_user.id_usuario)
        return result
    except HTTPException as exc:
        logger.warning("confirm_presence_failure user_id=%s status=%s detail=%s", current_user.id_usuario, exc.status_code, exc.detail)
        raise
