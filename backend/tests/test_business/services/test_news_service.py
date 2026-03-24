import pytest
from unittest.mock import Mock, ANY
from business.services.news_service import NewsService


@pytest.fixture
def setup_news_service():
    mock_news_repo = Mock()
    mock_audit_repo = Mock()
    service = NewsService(repo=mock_news_repo, audit_repo=mock_audit_repo)
    return service, mock_news_repo, mock_audit_repo


def test_update_news_forbidden(setup_news_service):
    """Usuário comum não pode editar notícia de outro autor."""
    service, news_repo, _ = setup_news_service
    
    mock_news = Mock()
    mock_news.author_id = 99
    news_repo.get_by_id.return_value = mock_news
    
    result = service.update_news(1, {}, user_id=1, user_role="student", version_sent=1)
    
    assert result == "forbidden"


def test_update_news_concurrency_error(setup_news_service):
    """Erro quando versão enviada é diferente da atual."""
    service, news_repo, _ = setup_news_service
    
    mock_news = Mock()
    mock_news.author_id = 1
    mock_news.version = 2
    news_repo.get_by_id.return_value = mock_news
    
    result = service.update_news(1, {}, user_id=1, user_role="admin", version_sent=1)
    
    assert result == "concurrency_error"


def test_delete_news_soft_delete(setup_news_service):
    """Soft delete quando notícia tem leituras."""
    service, news_repo, audit_repo = setup_news_service
    
    mock_news = Mock()
    mock_news.author_id = 1
    news_repo.get_by_id.return_value = mock_news
    news_repo.count_reads.return_value = 5
    news_repo.soft_delete.return_value = True
    
    result = service.delete_news(1, user_id=1, user_role="admin")
    
    assert result is True
    news_repo.soft_delete.assert_called_once_with(1)
    audit_repo.log_action.assert_called_once()


def test_delete_news_physical_delete(setup_news_service):
    """Physical delete quando notícia não tem leituras."""
    service, news_repo, _ = setup_news_service
    
    mock_news = Mock()
    mock_news.author_id = 1
    news_repo.get_by_id.return_value = mock_news
    news_repo.count_reads.return_value = 0
    news_repo.physical_delete.return_value = True
    
    result = service.delete_news(1, user_id=1, user_role="admin")
    
    assert result is True
    news_repo.physical_delete.assert_called_once_with(1)


def test_get_news_and_log_read(setup_news_service):
    """Buscar notícia registra log de leitura."""
    service, news_repo, _ = setup_news_service
    
    mock_news = Mock()
    news_repo.get_by_id.return_value = mock_news
    
    result = service.get_news_and_log_read(news_id=10, user_id=1)
    
    assert result == mock_news
    news_repo.register_read.assert_called_once_with(10, 1)