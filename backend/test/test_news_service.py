"""
test_news_service.py — Testes unitários do NewsService.

Cobre os fluxos de:
- Publicação de comunicados
- Leitura com registro de visualização
- Atualização com controle de permissão e versão
- Exclusão híbrida (soft delete vs físico)
"""

import pytest
from unittest.mock import MagicMock

from business.services.news_service import NewsService


# ==============================================================================
# FIXTURE LOCAL
# ==============================================================================

@pytest.fixture
def news_service(mock_news_repo, mock_audit_repo):
    return NewsService(repo=mock_news_repo, audit_repo=mock_audit_repo)


# ==============================================================================
# TESTES: CRIAÇÃO DE NOTÍCIA (create_news)
# ==============================================================================

class TestCreateNews:

    def test_create_news_success(self, news_service, mock_news_repo, mock_audit_repo, fake_news):
        """Criação de comunicado deve vincular o autor e registrar auditoria."""
        news_model = MagicMock()
        mock_news_repo.create.return_value = fake_news

        result = news_service.create_news(news_model, admin_id="uuid-admin-001")

        assert result == fake_news
        assert news_model.author_id == "uuid-admin-001"
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "CREATE"

    def test_create_news_failure_does_not_audit(
        self, news_service, mock_news_repo, mock_audit_repo
    ):
        """Falha na criação não deve gerar log de auditoria."""
        news_model = MagicMock()
        mock_news_repo.create.return_value = None

        result = news_service.create_news(news_model, admin_id="uuid-admin-001")

        assert result is None
        mock_audit_repo.log_action.assert_not_called()


# ==============================================================================
# TESTES: LEITURA (get_news_and_log_read)
# ==============================================================================

class TestGetNews:

    def test_get_news_registers_read(self, news_service, mock_news_repo, fake_news):
        """Busca de notícia existente deve registrar visualização única."""
        mock_news_repo.get_by_id.return_value = fake_news

        result = news_service.get_news_and_log_read("uuid-news-001", user_id="uuid-user-001")

        assert result == fake_news
        mock_news_repo.register_read.assert_called_once_with("uuid-news-001", "uuid-user-001")

    def test_get_news_not_found_does_not_register_read(self, news_service, mock_news_repo):
        """Notícia não encontrada não deve registrar leitura."""
        mock_news_repo.get_by_id.return_value = None

        result = news_service.get_news_and_log_read("id-inexistente", user_id="uuid-user-001")

        assert result is None
        mock_news_repo.register_read.assert_not_called()


# ==============================================================================
# TESTES: ATUALIZAÇÃO (update_news)
# ==============================================================================

class TestUpdateNews:

    def test_update_news_by_admin_success(
        self, news_service, mock_news_repo, mock_audit_repo, fake_news
    ):
        """Admin pode editar qualquer notícia (não precisa ser autor)."""
        mock_news_repo.get_by_id.return_value = fake_news
        updated = MagicMock()
        mock_news_repo.update.return_value = updated

        news_data = MagicMock()
        news_data.current_version = None  # sem versioning nesse caso

        result = news_service.update_news(
            "uuid-news-001", news_data, user_id="outro-uuid", user_role="admin"
        )

        assert result == updated
        mock_audit_repo.log_action.assert_called_once()

    def test_update_news_by_author_success(
        self, news_service, mock_news_repo, mock_audit_repo, fake_news
    ):
        """Autor pode editar sua própria notícia."""
        fake_news.author_id = "uuid-autor-001"
        mock_news_repo.get_by_id.return_value = fake_news
        updated = MagicMock()
        mock_news_repo.update.return_value = updated

        news_data = MagicMock()
        news_data.current_version = None

        result = news_service.update_news(
            "uuid-news-001", news_data, user_id="uuid-autor-001", user_role="staff"
        )

        assert result == updated

    def test_update_news_by_non_author_returns_forbidden(
        self, news_service, mock_news_repo, fake_news
    ):
        """Staff que não é o autor não deve ter permissão de edição."""
        fake_news.author_id = "uuid-outro-autor"
        mock_news_repo.get_by_id.return_value = fake_news

        news_data = MagicMock()
        news_data.current_version = 1

        result = news_service.update_news(
            "uuid-news-001", news_data, user_id="uuid-usuario-qualquer", user_role="staff"
        )

        assert result == "forbidden"

    def test_update_news_version_conflict(
        self, news_service, mock_news_repo, fake_news
    ):
        """Versão divergente deve retornar 'concurrency_error'."""
        fake_news.author_id = "uuid-admin-001"
        fake_news.version = 2  # banco está na versão 2
        mock_news_repo.get_by_id.return_value = fake_news

        news_data = MagicMock()
        news_data.current_version = 1  # cliente enviou versão antiga

        result = news_service.update_news(
            "uuid-news-001", news_data, user_id="uuid-admin-001", user_role="admin"
        )

        assert result == "concurrency_error"

    def test_update_news_not_found_returns_none(self, news_service, mock_news_repo):
        """Notícia não encontrada deve retornar None."""
        mock_news_repo.get_by_id.return_value = None

        result = news_service.update_news(
            "id-invalido", MagicMock(), user_id="uuid-admin", user_role="admin"
        )

        assert result is None


# ==============================================================================
# TESTES: EXCLUSÃO HÍBRIDA (delete_news)
# ==============================================================================

class TestDeleteNews:

    def test_delete_news_with_readers_does_soft_delete(
        self, news_service, mock_news_repo, mock_audit_repo, fake_news
    ):
        """Notícia com leituras deve ser soft-deleted."""
        fake_news.author_id = "uuid-admin-001"
        mock_news_repo.get_by_id.return_value = fake_news
        mock_news_repo.count_reads.return_value = 5  # tem leitores
        mock_news_repo.soft_delete.return_value = True

        result = news_service.delete_news("uuid-news-001", user_id="uuid-admin-001", user_role="admin")

        assert result is True
        mock_news_repo.soft_delete.assert_called_once_with("uuid-news-001")
        mock_news_repo.physical_delete.assert_not_called()

    def test_delete_news_without_readers_does_physical_delete(
        self, news_service, mock_news_repo, mock_audit_repo, fake_news
    ):
        """Notícia sem leituras deve ser deletada fisicamente."""
        fake_news.author_id = "uuid-admin-001"
        mock_news_repo.get_by_id.return_value = fake_news
        mock_news_repo.count_reads.return_value = 0  # sem leitores
        mock_news_repo.physical_delete.return_value = True

        result = news_service.delete_news("uuid-news-001", user_id="uuid-admin-001", user_role="admin")

        assert result is True
        mock_news_repo.physical_delete.assert_called_once_with("uuid-news-001")
        mock_news_repo.soft_delete.assert_not_called()

    def test_delete_news_forbidden_for_non_author(
        self, news_service, mock_news_repo, fake_news
    ):
        """Usuário sem permissão deve receber 'forbidden'."""
        fake_news.author_id = "uuid-outro-autor"
        mock_news_repo.get_by_id.return_value = fake_news

        result = news_service.delete_news(
            "uuid-news-001", user_id="uuid-usuario-random", user_role="staff"
        )

        assert result == "forbidden"

    def test_delete_news_not_found_returns_none(self, news_service, mock_news_repo):
        """Notícia inexistente deve retornar None."""
        mock_news_repo.get_by_id.return_value = None

        result = news_service.delete_news("id-invalido", user_id="uuid-admin", user_role="admin")

        assert result is None

    def test_delete_news_logs_audit_on_success(
        self, news_service, mock_news_repo, mock_audit_repo, fake_news
    ):
        """Exclusão bem-sucedida deve registrar auditoria."""
        fake_news.author_id = "uuid-admin-001"
        mock_news_repo.get_by_id.return_value = fake_news
        mock_news_repo.count_reads.return_value = 0
        mock_news_repo.physical_delete.return_value = True

        news_service.delete_news("uuid-news-001", user_id="uuid-admin-001", user_role="admin")

        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "DELETE"
