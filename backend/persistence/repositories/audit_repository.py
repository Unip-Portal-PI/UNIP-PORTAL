from sqlalchemy.orm import Session
from persistence.models.audit_model import AuditLogModel

# ==============================================================================
# REPOSITÓRIO DE AUDITORIA (GOVERNANCE & DATA ACCESS)
# ==============================================================================
class AuditRepository:
    """
    Gerencia a persistência e recuperação de logs de auditoria.
    Implementa o rastro de responsabilidade (Accountability).
    """

    def __init__(self, db: Session):
        """
        Injeta a sessão do banco de dados para operações de I/O.
        """
        self.db = db

    # ==========================================================================
    # ESCRITA DE LOGS (APPEND-ONLY)
    # ==========================================================================
    def log_action(self, user_id: str, action: str, table_name: str, description: str):
        """
        Registra uma ação crítica. O uso de commit() imediato aqui isola
        o log de possíveis rollbacks na lógica de negócio principal.
        """
        log = AuditLogModel(
            user_id=user_id,
            action=action,
            table_name=table_name,
            description=description
        )
        try:
            self.db.add(log)
            self.db.commit()
            self.db.refresh(log)
            return log
        except Exception:
            self.db.rollback()
            return None

    # ==========================================================================
    # CONSULTA E INVESTIGAÇÃO (READ-ONLY)
    # ==========================================================================
    def list_logs(self, skip: int = 0, limit: int = 50):
        """
        Retorna a timeline de eventos do sistema, priorizando os mais novos.
        """
        return self.db.query(AuditLogModel)\
            .order_by(AuditLogModel.timestamp.desc())\
            .offset(skip).limit(limit).all()

    def get_logs_by_user(self, user_id: str, limit: int = 20):
        """
        Filtra o histórico de ações de um usuário específico.
        Útil para auditorias pontuais de comportamento.
        """
        return self.db.query(AuditLogModel)\
            .filter(AuditLogModel.user_id == user_id)\
            .order_by(AuditLogModel.timestamp.desc())\
            .limit(limit).all()