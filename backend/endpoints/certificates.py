from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from persistence.database import get_db
from business.services.certificate_service import CertificateService
from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.models.enrollment_model import EnrollmentModel  # Importação essencial
from core.security import RoleChecker, oauth2_scheme, settings
from jose import jwt, JWTError

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE CERTIFICADOS (ACADEMIC CREDENTIALS)
# ==============================================================================
router = APIRouter()

# Definição de acesso: Estudantes, Admins e Colaboradores podem emitir documentos
require_student = RoleChecker(["student", "staff", "admin"])

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """Extrai o ID do usuário do token JWT para garantir segurança (anti-IDOR)."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Identificação ausente.")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

# ==============================================================================
# ENDPOINTS DE DOCUMENTAÇÃO ACADÊMICA
# ==============================================================================
@router.get(
    "/download/{enrollment_id}", 
    dependencies=[Depends(require_student)],
    summary="Gera e baixa o certificado em PDF",
    description="Emite dinamicamente o certificado caso a presença tenha sido confirmada.",
    tags=["Certificados"]
)
def download_certificate(
    enrollment_id: int, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Gera dinamicamente o certificado de participação para uma inscrição confirmada.
    """
    # 1. INICIALIZAÇÃO DO SERVIÇO
    repo = EnrollmentRepository(db)
    service = CertificateService(repo)
    
    # 2. [SEGURANÇA] Busca direta via Model para evitar AttributeError
    enrollment = db.query(EnrollmentModel).filter(EnrollmentModel.id == enrollment_id).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscrição não localizada.")
        
    # [SEGURANÇA] Validação de Propriedade: 
    # Garante que o usuário logado só acesse seus próprios certificados.
    if enrollment.user_id != current_user_id:
         raise HTTPException(
             status_code=403, 
             detail="Acesso negado. Este certificado pertence a outro usuário."
         )

    # 3. PROCESSAMENTO DO DOCUMENTO
    pdf_content = service.generate_pdf(enrollment_id)
    
    # 4. VALIDAÇÃO DE CRITÉRIOS DE EMISSÃO (PRESENÇA)
    if not pdf_content:
        raise HTTPException(
            status_code=400, 
            detail="Certificado indisponível. Sua presença neste evento ainda não foi validada."
        )

    # ==========================================================================
    # RESPOSTA DE DOWNLOAD (BINARY STREAM)
    # ==========================================================================
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificado_evento_{enrollment_id}.pdf"
        }
    )