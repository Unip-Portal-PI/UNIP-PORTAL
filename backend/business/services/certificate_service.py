from fpdf import FPDF
from io import BytesIO
from persistence.repositories.enrollment_repository import EnrollmentRepository

# ==============================================================================
# SERVIÇO DE EMISSÃO DE DOCUMENTOS (DOCUMENT & REPORTING SERVICE)
# ==============================================================================
class CertificateService:
    """
    Serviço especializado na geração de documentos PDF.
    Responsável por validar a elegibilidade (presença confirmada) e formatar o certificado.
    Utiliza a biblioteca FPDF para manipulação de layout.
    """

    def __init__(self, enrollment_repo: EnrollmentRepository):
        """
        Injeção de dependência do repositório de inscrições para acesso aos dados
        de alunos e eventos.
        """
        self.repo = enrollment_repo

    # ==========================================================================
    # GERAÇÃO DE CERTIFICADOS (BUSINESS LOGIC)
    # ==========================================================================
    def generate_pdf(self, enrollment_id: int):
        """
        Gera um certificado de participação personalizado em formato PDF.
        
        Args:
            enrollment_id: ID da inscrição do aluno no evento.
            
        Returns:
            bytes: O conteúdo do PDF gerado ou None se a presença não estiver confirmada.
        """
        
        # ======================================================================
        # 1. VALIDAÇÃO DE ELEGIBILIDADE
        # ======================================================================
        # Verifica se a inscrição existe e se o aluno realmente compareceu (is_present)
        enrollment = self.repo.db.query(
            self.repo.db.get_model("EnrollmentModel")
        ).filter_by(id=enrollment_id).first()
        
        if not enrollment or not enrollment.is_present:
            return None

        # ======================================================================
        # 2. CONFIGURAÇÃO ESTRUTURAL (LAYOUT ENGINE)
        # ======================================================================
        # Definido como Paisagem (L), milímetros e formato A4
        pdf = FPDF(orientation='L', unit='mm', format='A4')
        pdf.add_page()
        
        # Estilização: Moldura externa para acabamento estético
        pdf.set_line_width(1)
        pdf.rect(10, 10, 277, 190)

        # ======================================================================
        # 3. CONSTRUÇÃO DO CONTEÚDO (EDITORIAL DESIGN)
        # ======================================================================
        
        # Cabeçalho Principal
        pdf.set_font("Helvetica", "B", 30)
        pdf.cell(0, 40, "CERTIFICADO DE PARTICIPAÇÃO", ln=True, align='C')
        
        # Texto Introdutório
        pdf.set_font("Helvetica", "", 18)
        pdf.ln(10)
        pdf.multi_cell(0, 10, "Certificamos que o(a) aluno(a)", align='C')
        
        # Nome do Aluno (Destaque em Negrito/Maiúsculo)
        pdf.set_font("Helvetica", "B", 24)
        pdf.cell(0, 20, f"{enrollment.user.name.upper()}", ln=True, align='C')
        
        # Corpo do Texto: Detalhes Dinâmicos do Evento
        pdf.set_font("Helvetica", "", 18)
        texto_evento = (
            f"participou do evento '{enrollment.event.name}', "
            f"realizado em {enrollment.event.event_date.strftime('%d/%m/%Y')}, "
            f"com carga horária de {enrollment.event.time}."
        )
        pdf.multi_cell(0, 10, texto_evento, align='C')

        # ======================================================================
        # 4. SEGURANÇA E RASTREABILIDADE (COMPLIANCE)
        # ======================================================================
        # Informações para verificação de validade do documento
        pdf.ln(20)
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 10, f"Código de Autenticação: {enrollment.qr_code_token}", ln=True, align='C')
        
        # Registro temporal da emissão baseada na presença real
        data_geracao = enrollment.present_at.strftime('%d/%m/%Y %H:%M') if enrollment.present_at else "--/--/--"
        pdf.cell(0, 5, f"Gerado em: {data_geracao}", ln=True, align='C')

        # ======================================================================
        # 5. FINALIZAÇÃO DO DOCUMENTO
        # ======================================================================
        # Retorna o conteúdo binário pronto para StreamResponse no FastAPI
        return pdf.output()