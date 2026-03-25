"""
test_internship_and_dashboard_service.py — Testes unitários atualizados.
Correção: Remoção do desempacotamento incorreto de dicionários nos testes de Dashboard.
"""

import pytest
from unittest.mock import MagicMock

from business.services.internship_service import InternshipService
from business.services.dashboard_service import DashboardService


# ==============================================================================
# FIXTURES LOCAIS
# ==============================================================================

@pytest.fixture
def internship_service(mock_internship_repo, mock_audit_repo):
    return InternshipService(repo=mock_internship_repo, audit_repo=mock_audit_repo)


@pytest.fixture
def dashboard_service(mock_enrollment_repo, mock_news_repo, mock_internship_repo):
    return DashboardService(
        enrollment_repo=mock_enrollment_repo,
        news_repo=mock_news_repo,
        internship_repo=mock_internship_repo
    )


# ==============================================================================
# TESTES: InternshipService — CRIAÇÃO
# ==============================================================================

class TestCreateInternship:

    def test_create_internship_success(
        self, internship_service, mock_internship_repo, mock_audit_repo, fake_internship
    ):
        """Criação válida deve retornar a vaga e registrar auditoria."""
        mock_internship_repo.create.return_value = fake_internship
        internship_model = MagicMock()

        result = internship_service.create_internship(internship_model, admin_id=1)

        assert result == fake_internship
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "CREATE"
        assert call_kwargs["table_name"] == "internships"

    def test_create_internship_failure_does_not_audit(
        self, internship_service, mock_internship_repo, mock_audit_repo
    ):
        """Falha na criação não deve gerar log."""
        mock_internship_repo.create.return_value = None

        result = internship_service.create_internship(MagicMock(), admin_id=1)

        assert result is None
        mock_audit_repo.log_action.assert_not_called()


# ==============================================================================
# TESTES: InternshipService — CONSULTAS
# ==============================================================================

class TestListInternships:

    def test_list_internships_delegates_to_repo(
        self, internship_service, mock_internship_repo, fake_internship
    ):
        """Listagem deve delegar ao repositório com os parâmetros corretos."""
        mock_internship_repo.list.return_value = [fake_internship]

        result = internship_service.list_internships(skip=0, limit=10, search="Python")

        assert result == [fake_internship]
        mock_internship_repo.list.assert_called_once_with(skip=0, limit=10, search="Python")

    def test_get_internship_found(
        self, internship_service, mock_internship_repo, fake_internship
    ):
        """Busca por ID existente deve retornar a vaga."""
        mock_internship_repo.get_by_id.return_value = fake_internship

        result = internship_service.get_internship(1)

        assert result == fake_internship

    def test_get_internship_not_found_returns_none(
        self, internship_service, mock_internship_repo
    ):
        """ID inexistente deve retornar None."""
        mock_internship_repo.get_by_id.return_value = None

        result = internship_service.get_internship(9999)

        assert result is None


# ==============================================================================
# TESTES: InternshipService — ATUALIZAÇÃO
# ==============================================================================

class TestUpdateInternship:

    def test_update_internship_success(
        self, internship_service, mock_internship_repo, mock_audit_repo, fake_internship
    ):
        """Atualização válida deve retornar a vaga e logar."""
        mock_internship_repo.update.return_value = fake_internship

        result = internship_service.update_internship(1, MagicMock(), admin_id=1)

        assert result == fake_internship
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "UPDATE"

    def test_update_internship_not_found_returns_none(
        self, internship_service, mock_internship_repo
    ):
        """Atualização de ID inexistente deve retornar None sem auditoria."""
        mock_internship_repo.update.return_value = None

        result = internship_service.update_internship(9999, MagicMock(), admin_id=1)

        assert result is None


# ==============================================================================
# TESTES: InternshipService — EXCLUSÃO
# ==============================================================================

class TestDeleteInternship:

    def test_delete_internship_success(
        self, internship_service, mock_internship_repo, mock_audit_repo
    ):
        """Soft delete bem-sucedido deve retornar True e logar."""
        mock_internship_repo.delete.return_value = True

        result = internship_service.delete_internship(1, admin_id=1)

        assert result is True
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "DELETE"

    def test_delete_internship_not_found_returns_falsy(
        self, internship_service, mock_internship_repo
    ):
        """ID inexistente deve retornar valor falsy sem auditoria."""
        mock_internship_repo.delete.return_value = False

        result = internship_service.delete_internship(9999, admin_id=1)

        assert not result


# ==============================================================================
# TESTES: DashboardService (CORRIGIDOS)
# ==============================================================================

class TestDashboardService:

    def test_get_student_summary_returns_all_sections(
        self,
        dashboard_service,
        mock_enrollment_repo,
        mock_news_repo,
        mock_internship_repo
    ):
        """O resumo deve conter as três seções: inscrições, notícias e estágios."""
        mock_enrollment_repo.list_by_user.return_value = [MagicMock(), MagicMock()]
        mock_news_repo.list.return_value = [MagicMock()]
        mock_internship_repo.list.return_value = [MagicMock(), MagicMock(), MagicMock()]

        # CORREÇÃO: Removido o desempacotamento , *_
        result = dashboard_service.get_student_summary(user_id=1)

        assert "my_enrollments" in result
        assert "latest_news" in result
        assert "recent_internships" in result
        assert len(result["my_enrollments"]) == 2
        assert len(result["latest_news"]) == 1
        assert len(result["recent_internships"]) == 3

    def test_get_student_summary_empty_repos_return_empty_lists(
        self,
        dashboard_service,
        mock_enrollment_repo,
        mock_news_repo,
        mock_internship_repo
    ):
        """Repositórios sem dados devem retornar listas vazias (sem quebrar o frontend)."""
        mock_enrollment_repo.list_by_user.return_value = []
        mock_news_repo.list.return_value = []
        mock_internship_repo.list.return_value = []

        result = dashboard_service.get_student_summary(user_id=1)

        assert result["my_enrollments"] == []
        assert result["latest_news"] == []
        assert result["recent_internships"] == []

    def test_get_student_summary_none_repos_return_empty_lists(
        self,
        dashboard_service,
        mock_enrollment_repo,
        mock_news_repo,
        mock_internship_repo
    ):
        """Repositórios retornando None devem ser tratados como listas vazias."""
        mock_enrollment_repo.list_by_user.return_value = None
        mock_news_repo.list.return_value = None
        mock_internship_repo.list.return_value = None

        result = dashboard_service.get_student_summary(user_id=1)

        assert result["my_enrollments"] == []
        assert result["latest_news"] == []
        assert result["recent_internships"] == []

    def test_get_student_summary_invalid_user_id_returns_empty_enrollments(
        self,
        dashboard_service,
        mock_enrollment_repo,
        mock_news_repo,
        mock_internship_repo
    ):
        """ID de usuário inválido (ex: string não numérica) deve retornar lista vazia de inscrições."""
        mock_enrollment_repo.list_by_user.side_effect = ValueError("invalid id")
        mock_news_repo.list.return_value = []
        mock_internship_repo.list.return_value = []

        result = dashboard_service.get_student_summary(user_id="invalido")

        assert result["my_enrollments"] == []

    def test_get_student_summary_calls_repos_with_correct_limits(
        self,
        dashboard_service,
        mock_enrollment_repo,
        mock_news_repo,
        mock_internship_repo
    ):
        """O dashboard deve buscar no máximo 3 itens de notícias e estágios."""
        mock_enrollment_repo.list_by_user.return_value = []
        mock_news_repo.list.return_value = []
        mock_internship_repo.list.return_value = []

        dashboard_service.get_student_summary(user_id=1)

        mock_news_repo.list.assert_called_once_with(skip=0, limit=3)
        mock_internship_repo.list.assert_called_once_with(skip=0, limit=3)