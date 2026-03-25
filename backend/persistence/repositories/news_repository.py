from sqlalchemy.orm import Session
from persistence.models.news_model import NewsModel
from persistence.models.news_read_model import NewsReadLogModel
from typing import Optional, List

# ==============================================================================
# REPOSITÓRIO DE CONTEÚDO EDITORIAL (NEWS & GOVERNANCE LAYER)
# ==============================================================================
class NewsRepository:
    """
    Gerencia o ciclo de vida das notícias. 
    Atualizado para suportar IDs em formato UUID (String) e novos campos editoriais.
    """

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================================
    # PERSISTÊNCIA E CONSULTA
    # ==========================================================================
    def create(self, news: NewsModel) -> NewsModel:
        """Persiste uma nova notícia oficial no portal."""
        self.db.add(news)
        self.db.commit()
        self.db.refresh(news)
        return news

    def get_by_id(self, news_id: str) -> Optional[NewsModel]:
        """
        Busca notícia ativa por UUID.
        Nota: news_id agora espera uma String (UUID).
        """
        return self.db.query(NewsModel).filter(
            NewsModel.id == news_id, 
            NewsModel.is_active == True
        ).first()

    def list(self, skip: int = 0, limit: int = 10, include_expired: bool = False) -> List[NewsModel]:
        """
        Retorna o feed de notícias ordenado das mais recentes.
        Filtra automaticamente notícias inativas.
        """
        query = self.db.query(NewsModel).filter(NewsModel.is_active == True)
        
        # Opcional: Filtro para não listar notícias cuja data de validade já passou
        # if not include_expired:
        #     from datetime import datetime, timezone
        #     query = query.filter(
        #         (NewsModel.expires_at == None) | (NewsModel.expires_at > datetime.now(timezone.utc))
        #     )

        return query.order_by(NewsModel.created_at.desc())\
            .offset(skip).limit(limit).all()

    # ==========================================================================
    # GOVERNANÇA: ATUALIZAÇÃO E VERSIONAMENTO
    # ==========================================================================
    def update(self, news_id: str, news_data) -> Optional[NewsModel]:
        """
        Atualiza a notícia incrementando a versão e gerenciando campos JSON.
        """
        news = self.get_by_id(news_id)
        if not news:
            return None

        # Converte o schema/Dato em dicionário
        data_dict = news_data.dict(exclude_unset=True)
        
        # Proteção: impede alteração manual de campos de controle
        protected_fields = ["id", "version", "created_at", "author_id"]
        for field in protected_fields:
            data_dict.pop(field, None)

        for key, value in data_dict.items():
            if hasattr(news, key):
                setattr(news, key, value)
        
        # O SQLAlchemy tratará o onupdate do updated_at automaticamente
        news.version += 1
        
        self.db.commit()
        self.db.refresh(news)
        return news

    # ==========================================================================
    # ANALYTICS: RASTREAMENTO DE LEITURA
    # ==========================================================================
    def register_read(self, news_id: str, user_id: str):
        """Registra visualização única. news_id e user_id agora são UUIDs."""
        exists = self.db.query(NewsReadLogModel).filter_by(
            news_id=news_id, user_id=user_id
        ).first()
        
        if not exists:
            log = NewsReadLogModel(news_id=news_id, user_id=user_id)
            self.db.add(log)
            self.db.commit()
            self.db.refresh(log)
            return log
        return exists

    def count_reads(self, news_id: str) -> int:
        return self.db.query(NewsReadLogModel).filter_by(news_id=news_id).count()

    # ==========================================================================
    # CICLO DE VIDA (CLEANUP)
    # ==========================================================================
    def soft_delete(self, news_id: str) -> bool:
        """Desativação lógica por UUID."""
        news = self.db.query(NewsModel).filter_by(id=news_id).first()
        if news:
            news.is_active = False
            self.db.commit()
            return True
        return False

    def physical_delete(self, news_id: str) -> bool:
        """Remoção física por UUID."""
        news = self.db.query(NewsModel).filter_by(id=news_id).first()
        if news:
            self.db.delete(news)
            self.db.commit()
            return True
        return False