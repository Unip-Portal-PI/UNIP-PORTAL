import os
import uuid
from fastapi import UploadFile
from pathlib import Path

# ==============================================================================
# SERVIÇO DE GESTÃO DE ATIVOS DIGITAIS (ASSET & STORAGE SERVICE)
# ==============================================================================
class StorageService:
    """
    Serviço de Gestão de Armazenamento (FileSystem).
    Responsável pelo upload, renomeação e organização de arquivos estáticos,
    como banners de eventos e fotos de perfil.
    """
    
    # Configuração do diretório raiz para ativos estáticos
    UPLOAD_DIR = "static/banners"

    def __init__(self):
        """
        Inicializa o serviço garantindo que a estrutura de diretórios exista.
        Garante a integridade do FileSystem no startup da aplicação.
        """
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)

    # ==========================================================================
    # PROCESSAMENTO DE MÍDIA (FILE PIPELINE)
    # ==========================================================================
    async def save_banner(self, file: UploadFile) -> str:
        """
        Processa e salva um arquivo de banner no disco com um nome único.
        
        Args:
            file (UploadFile): Objeto de arquivo recebido via multipart/form-data.
            
        Returns:
            str: Caminho relativo (URL path) para persistência no Banco de Dados.
        """
        
        # ======================================================================
        # 1. GERAÇÃO DE IDENTIDADE ÚNICA (UUID)
        # ======================================================================
        # Extrai a extensão e gera um nome aleatório para evitar colisões e ataques
        # de Directory Traversal através de nomes de arquivos maliciosos.
        extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{extension}"
        file_path = os.path.join(self.UPLOAD_DIR, unique_filename)

        # ======================================================================
        # 2. ESCRITA EM DISCO (ASYNC READ / SYNC WRITE)
        # ======================================================================
        # Abre o buffer binário para persistência física do arquivo.
        try:
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
        except Exception as e:
            # Re-lança a exceção para ser capturada pelo Middleware de erro do FastAPI
            raise e

        # ======================================================================
        # 3. NORMALIZAÇÃO DE URL
        # ======================================================================
        # Retorna o path formatado que será servido pelo app.mount("/static", ...)
        return f"/static/banners/{unique_filename}"