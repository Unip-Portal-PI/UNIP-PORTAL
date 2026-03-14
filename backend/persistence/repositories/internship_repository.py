from sqlalchemy.orm import Session
from persistence.models.internship_model import InternshipModel
from typing import Optional, List

# ==============================================================================
# REPOSITÓRIO DE OPORTUNIDADES (CAREERS & INTERNSHIP LAYER)
# ==============================================================================
class InternshipRepository:
    """
    Gerencia o mural de vagas de estágio e emprego.
    Implementa Soft Delete e busca textual otimizada em múltiplos campos.
    """

    def __init__(self, db: Session):
        """Injeta a sessão do SQLAlchemy para persistência."""
        self.db = db

    # ==========================================================================
    # CRIAÇÃO E PERSISTÊNCIA
    # ==========================================================================
    def create(self, internship: InternshipModel) -> InternshipModel:
        """Persiste uma nova oportunidade no banco de dados."""
        self.db.add(internship)
        self.db.commit()
        self.db.refresh(internship)
        return internship

    # ==========================================================================
    # CONSULTA COM FILTROS E BUSCA DINÂMICA
    # ==========================================================================
    def list(self, skip: int = 0, limit: int = 10, search: Optional[str] = None) -> List[InternshipModel]:
        """
        Lista apenas vagas ativas (is_active=True).
        Suporta busca case-insensitive por Empresa ou Cargo e ordena pelas mais novas.
        """
        query = self.db.query(InternshipModel).filter(InternshipModel.is_active == True)
        
        if search:
            # Filtro expandido: busca o termo no nome da empresa OU no cargo ocupado
            search_filter = f"%{search}%"
            query = query.filter(
                (InternshipModel.company.ilike(search_filter)) | 
                (InternshipModel.position.ilike(search_filter))
            )
            
        return query.order_by(InternshipModel.created_at.desc())\
                    .offset(skip).limit(limit).all()

    def get_by_id(self, internship_id: int) -> Optional[InternshipModel]:
        """Recupera uma vaga ativa pelo ID. Retorna None se estiver inativa ou inexistente."""
        return self.db.query(InternshipModel).filter(
            InternshipModel.id == internship_id, 
            InternshipModel.is_active == True
        ).first()

    # ==========================================================================
    # ATUALIZAÇÃO E CICLO DE VIDA (SOFT DELETE)
    # ==========================================================================
    def update(self, internship_id: int, internship_data) -> Optional[InternshipModel]:
        """
        Atualiza dados da vaga. Suporta PATCH (atualização parcial) 
        através do mapeamento dinâmico de atributos.
        """
        internship = self.get_by_id(internship_id)
        if not internship:
            return None
        
        # Converte o schema Pydantic para dicionário ignorando campos não enviados
        data_dict = internship_data.dict(exclude_unset=True)
        for key, value in data_dict.items():
            if hasattr(internship, key):
                setattr(internship, key, value)
            
        self.db.commit()
        self.db.refresh(internship)
        return internship

    def delete(self, internship_id: int) -> bool:
        """
        Executa o desmembramento lógico (Soft Delete).
        A vaga permanece no banco para auditoria, mas é removida de todas as listagens.
        """
        internship = self.db.query(InternshipModel).filter(
            InternshipModel.id == internship_id
        ).first()
        
        if not internship:
            return False
        
        internship.is_active = False
        self.db.commit()
        return True