from fpdf import FPDF
from io import BytesIO
from persistence.repositories.enrollment_repository import EnrollmentRepository
from persistence.models.enrollment_model import EnrollmentModel

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
        Injeção de dependência do repositório de inscrições.
        """
        self.repo = enrollment_repo

    # ==========================================================================
    # GERAÇÃO DE CERTIFICADOS (BUSINESS LOGIC)
    # ==========================================================================
    def generate_pdf(self, enrollment_id: int):
        """
        Gera um certificado de participação personalizado em formato PDF.
        
        Returns:
            bytes: O conteúdo do PDF gerado ou None se a presença não estiver confirmada.
        """
        
        # ======================================================================
        # 1. VALIDAÇÃO DE ELEGIBILIDADE E BUSCA DE DADOS
        # ======================================================================
        # Buscamos a inscrição garantindo que os relacionamentos de User e Event existam
        enrollment = self.repo.db.query(EnrollmentModel).filter(
            EnrollmentModel.id == enrollment_id
        ).first()
        
        # Regra de Ouro: Sem presença confirmada, sem certificado.
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
        pdf.ln(30) # Espaçamento superior
        pdf.cell(0, 20, "CERTIFICADO DE PARTICIPAÇÃO", ln=True, align='C')
        
        # Texto Introdutório
        pdf.set_font("Helvetica", "", 18)
        pdf.ln(10)
        pdf.multi_cell(0, 10, "Certificamos que o(a) aluno(a)", align='C')
        
        # Nome do Aluno (Destaque em Negrito/Maiúsculo)
        pdf.set_font("Helvetica", "B", 26)
        student_name = enrollment.user.name if enrollment.user else "Participante"
        pdf.cell(0, 25, f"{student_name.upper()}", ln=True, align='C')
        
        # Corpo do Texto: Detalhes Dinâmicos do Evento
        pdf.set_font("Helvetica", "", 18)
        pdf.ln(5)
        
        event_name = enrollment.event.title if enrollment.event else "Evento Acadêmico"
        event_date = enrollment.event.start_time.strftime('%d/%m/%Y') if enrollment.event else "--/--/----"
        
        texto_evento = (
            f"participou com êxito do evento '{event_name}', "
            f"realizado em {event_date}, "
            f"cumprindo todos os requisitos de presença."
        )
        pdf.multi_cell(0, 10, texto_evento, align='C')

        # ======================================================================
        # 4. SEGURANÇA E RASTREABILIDADE (COMPLIANCE)
        # ======================================================================
        pdf.ln(25)
        pdf.set_font("Helvetica", "I", 10)
        
        auth_code = enrollment.qr_code_token or "N/A"
        pdf.cell(0, 8, f"Código de Autenticação: {auth_code}", ln=True, align='C')
        
        data_geracao = enrollment.present_at.strftime('%d/%m/%Y %H:%M') if enrollment.present_at else "--/--/--"
        pdf.cell(0, 5, f"Presença validada em: {data_geracao}", ln=True, align='C')

        # ======================================================================
        # 5. FINALIZAÇÃO E RETORNO (CORREÇÃO DO BYTEARRAY)
        # ======================================================================
        # A lib FPDF pode retornar string ou bytearray dependendo da versão.
        # Aqui garantimos que o retorno seja SEMPRE bytes para o FastAPI.
        pdf_output = pdf.output()
        
        if isinstance(pdf_output, (bytes, bytearray)):
            return bytes(pdf_output)
        
        # Caso retorne string (versões antigas), encodamos para latin-1
        return str(pdf_output).encode('latin-1')