from sqlalchemy.orm import Session
from persistence.models.news_model import NewsModel, NewsReadModel
from typing import Optional, List

# ==============================================================================
# REPOSITÓRIO DE CONTEÚDO EDITORIAL (NEWS & GOVERNANCE LAYER)
# ==============================================================================
class NewsRepository:
    """
    Gerencia o ciclo de vida das notícias, integrando logs de leitura,
    controle de concorrência e estratégias de exclusão condicional.
    """

    def __init__(self, db: Session):
        """Injeta a sessão do SQLAlchemy para persistência."""
        self.db = db

    # ==========================================================================
    # PERSISTÊNCIA E CONSULTA (VISIBILIDADE PÚBLICA)
    # ==========================================================================
    def create(self, news: NewsModel) -> NewsModel:
        """Persiste uma nova notícia oficial no portal."""
        self.db.add(news)
        self.db.commit()
        self.db.refresh(news)
        return news

    def get_by_id(self, news_id: int) -> Optional[NewsModel]:
        """Busca notícia ativa. Registros em Soft Delete ou Excluídos são ignorados."""
        return self.db.query(NewsModel).filter(
            NewsModel.id == news_id, 
            NewsModel.is_active == True,
            NewsModel.status == "Ativo"
        ).first()

    def list(self, skip: int = 0, limit: int = 10) -> List[NewsModel]:
        """Retorna o feed de notícias ordenado das mais recentes para as antigas."""
        return self.db.query(NewsModel)\
            .filter(
                NewsModel.is_active == True,
                NewsModel.status == "Ativo"
            )\
            .order_by(NewsModel.created_at.desc())\
            .offset(skip).limit(limit).all()

    # ==========================================================================
    # GOVERNANÇA: CONCORRÊNCIA OTIMISTA
    # ==========================================================================
    def update(self, news_id: int, news_data) -> Optional[NewsModel]:
        """
        Atualiza a notícia incrementando a versão para evitar conflitos de edição.
        """
        news = self.get_by_id(news_id)
        if not news:
            return None

        # Converte o Pydantic para dict (suporta Pydantic v1 e v2)
        data_dict = news_data.dict(exclude_unset=True) if hasattr(news_data, 'dict') else news_data.model_dump(exclude_unset=True)
        
        # Proteção: impede que a versão seja alterada manualmente pelo payload
        data_dict.pop("version", None)
        data_dict.pop("current_version", None)

        for key, value in data_dict.items():
            if hasattr(news, key):
                setattr(news, key, value)
        
        # Mecanismo de Versão (Incremento manual para auditoria/concorrência)
        news.version += 1
        
        self.db.commit()
        self.db.refresh(news)
        return news

    # ==========================================================================
    # ANALYTICS: RASTREAMENTO DE LEITURA (RN09)
    # ==========================================================================
    def register_read(self, news_id: int, user_id: int):
        """
        Registra visualização única por usuário para estatísticas reais.
        """
        # AJUSTE: Sincronizado com NewsReadModel do seu news_model.py
        exists = self.db.query(NewsReadModel).filter_by(
            news_id=news_id, user_id=user_id
        ).first()
        
        if not exists:
            log = NewsReadModel(news_id=news_id, user_id=user_id)
            self.db.add(log)
            self.db.commit()
            self.db.refresh(log)
            return log
        return exists

    def count_reads(self, news_id: int) -> int:
        """Retorna o total de leitores únicos de uma notícia."""
        return self.db.query(NewsReadModel).filter_by(news_id=news_id).count()

    # ==========================================================================
    # ESTRATÉGIAS DE CICLO DE VIDA (CLEANUP)
    # ==========================================================================
    def soft_delete(self, news_id: int) -> bool:
        """Executa a desativação lógica (RN04)."""
        news = self.db.query(NewsModel).filter_by(id=news_id).first()
        if news:
            news.is_active = False
            news.status = "Excluido" # Rastro de auditoria
            self.db.commit()
            return True
        return False

    def physical_delete(self, news_id: int) -> bool:
        """Executa a remoção física definitiva do banco."""
        news = self.db.query(NewsModel).filter_by(id=news_id).first()
        if news:
            self.db.delete(news)
            self.db.commit()
            return True
        return False