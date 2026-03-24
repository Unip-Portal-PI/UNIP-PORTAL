import pytest
from unittest.mock import Mock, ANY
from business.services.internship_service import InternshipService


@pytest.fixture
def setup_service():
    mock_repo = Mock()
    mock_audit = Mock()
    service = InternshipService(repo=mock_repo, audit_repo=mock_audit)
    return service, mock_repo, mock_audit


def test_create_internship_success(setup_service):
    service, repo, audit = setup_service
    
    mock_internship = Mock()
    repo.create.return_value = mock_internship
    
    result = service.create_internship(mock_internship, admin_id=10)
    
    assert result == mock_internship
    audit.log_action.assert_called_once()


def test_list_internships(setup_service):
    service, repo, _ = setup_service
    
    service.list_internships(skip=5, limit=15, search="Python")
    
    repo.list.assert_called_once_with(skip=5, limit=15, search="Python")


def test_get_internship_not_found(setup_service):
    service, repo, _ = setup_service
    repo.get_by_id.return_value = None
    
    result = service.get_internship(999)
    
    assert result is None


def test_update_internship_audit(setup_service):
    service, repo, audit = setup_service
    
    mock_updated = Mock()
    repo.update.return_value = mock_updated
    
    result = service.update_internship(5, {"salary": 1500}, admin_id=1)
    
    assert result == mock_updated
    audit.log_action.assert_called_once()


def test_delete_internship(setup_service):
    service, repo, audit = setup_service
    repo.delete.return_value = True
    
    result = service.delete_internship(20, admin_id=1)
    
    assert result is True
    repo.delete.assert_called_once_with(20)
    audit.log_action.assert_called_once()