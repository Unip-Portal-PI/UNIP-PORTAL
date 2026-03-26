from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import RoleChecker
from app.schemas.inscricao import PresencaConfirmRequest, PresencaConfirmResponse
from app.services import presenca_service

router = APIRouter(prefix="/enrollments", tags=["Inscricoes"])

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])


@router.post("/confirm-presence", response_model=PresencaConfirmResponse)
def confirm_presence(
    data: PresencaConfirmRequest,
    db: Session = Depends(get_db),
    current_user=Depends(allow_colaborador_adm),
):
    return presenca_service.confirm_presence(data.qr_code, current_user.id_usuario, db)
