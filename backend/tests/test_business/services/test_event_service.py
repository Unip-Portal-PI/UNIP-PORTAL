import pytest
from unittest.mock import Mock, ANY
from datetime import date, timedelta
from business.services.event_service import EventService


@pytest.fixture
def setup_service():
    mock_repo = Mock()
    mock_audit = Mock()
    service = EventService(repo=mock_repo, audit_repo=mock_audit)
    return service, mock_repo, mock_audit


def test_create_event_success(setup_service):
    service, repo, audit = setup_service
    
    event_data = {
        "title": "Workshop de FastAPI",
        "event_date": date.today() + timedelta(days=10),
        "registration_type": "internal",
        "total_slots": 50,
        "location": "Auditório A",
        "area": "TI"
    }
    
    mock_event = Mock()
    repo.create.return_value = mock_event
    
    result = service.create_event(event_data, admin_id=1)
    
    assert result == mock_event
    audit.log_action.assert_called_once()


def test_create_event_past_date_error(setup_service):
    service, _, _ = setup_service
    
    past_event = {
        "title": "Evento Antigo",
        "event_date": date.today() - timedelta(days=1)
    }
    
    with pytest.raises(ValueError):
        service.create_event(past_event, admin_id=1)


def test_create_external_event_without_url_error(setup_service):
    service, _, _ = setup_service
    
    external_event = {
        "title": "Evento Externo",
        "registration_type": "external",
        "external_url": ""
    }
    
    with pytest.raises(ValueError):
        service.create_event(external_event, admin_id=1)


def test_check_availability_no_vacancies(setup_service):
    service, repo, _ = setup_service
    
    mock_event = Mock()
    mock_event.registration_type = "internal"
    mock_event.is_active = True
    mock_event.is_registration_closed = False
    mock_event.has_vacancies = False
    repo.get_by_id.return_value = mock_event
    
    result = service.check_availability(1)
    
    assert result["available"] is False


def test_check_availability_external(setup_service):
    service, repo, _ = setup_service
    
    mock_event = Mock()
    mock_event.registration_type = "external"
    mock_event.external_url = "https://sympla.com/evento"
    repo.get_by_id.return_value = mock_event
    
    result = service.check_availability(2)
    
    assert result["available"] is True
    assert result["external"] is True
    assert result["url"] == "https://sympla.com/evento"


def test_delete_event_audit(setup_service):
    service, repo, audit = setup_service
    repo.delete.return_value = True
    
    result = service.delete_event(10, admin_id=1)
    
    assert result is True
    repo.delete.assert_called_once_with(10)
    audit.log_action.assert_called_once()