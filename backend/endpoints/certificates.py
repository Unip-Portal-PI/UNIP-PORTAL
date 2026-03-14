from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from persistence.database import get_db
from business.services.certificate_service import CertificateService
from persistence.repositories.enrollment_repository import EnrollmentRepository
from core.security import RoleChecker

# ==============================================================================
# CONFIGURAÇÃO DO ROTEADOR DE CERTIFICADOS (ACADEMIC CREDENTIALS)
# ==============================================================================
router = APIRouter()

# Definição de acesso: Estudantes, Admins e Colaboradores podem emitir documentos
require_student = RoleChecker(["Aluno", "Administrador", "Colaborador"])

# ==============================================================================
# ENDPOINTS DE DOCUMENTAÇÃO ACADÊMICA
# ==============================================================================
@router.get(
    "/download/{enrollment_id}", 
    dependencies=[Depends(require_student)],
    summary="Gera e baixa o certificado em PDF",
    description="Emite dinamicamente o certificado de participação caso a presença tenha sido confirmada.",
    tags=["Certificados"]
)
def download_certificate(enrollment_id: int, db: Session = Depends(get_db)):
    """
    Gera dinamicamente o certificado de participação para uma inscrição confirmada.
    
    Regras de Emissão:
    1. A inscrição deve existir.
    2. O status de presença (is_present) deve ser verdadeiro.
    
    Retorna:
        Response: Stream binário do arquivo PDF.
    """
    # 1. INICIALIZAÇÃO DO SERVIÇO (DI Injection manual)
    # Acopla o repositório de inscrições ao serviço de lógica de PDF
    service = CertificateService(EnrollmentRepository(db))
    
    # 2. PROCESSAMENTO DO DOCUMENTO
    pdf_content = service.generate_pdf(enrollment_id)
    
    # 3. VALIDAÇÃO DE CRITÉRIOS DE EMISSÃO
    # O serviço retorna None se o aluno não tiver o check-in confirmado
    if not pdf_content:
        raise HTTPException(
            status_code=403, 
            detail="Certificado indisponível. A presença neste evento ainda não foi validada."
        )

    # ==========================================================================
    # RESPOSTA DE DOWNLOAD (BINARY STREAM)
    # ==========================================================================
    # Define o media_type e o header de disposição para download automático
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificado_{enrollment_id}.pdf"
        }
    )