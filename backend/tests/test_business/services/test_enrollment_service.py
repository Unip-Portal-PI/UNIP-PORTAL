import pytest
from unittest.mock import Mock, MagicMock
from datetime import date, timedelta
from business.services.enrollment_service import EnrollmentService


@pytest.fixture
def service():
    mock_enroll_repo = Mock()
    mock_audit_repo = Mock()
    mock_event_repo = Mock()
    return EnrollmentService(mock_enroll_repo, mock_audit_repo, mock_event_repo)


def test_falha_se_evento_nao_existir(service):
    service.event_repo.get_by_id.return_value = None
    
    result = service.enroll_user(user_id=1, event_id=99)
    
    assert result == "event_not_found"


def test_falha_se_prazo_vencido(service):
    mock_event = Mock(deadline_date=date.today() - timedelta(days=1))
    service.event_repo.get_by_id.return_value = mock_event
    
    result = service.enroll_user(user_id=1, event_id=1)
    
    assert result == "deadline_exceeded"


def test_confirmar_presenca_sucesso(service):
    mock_enrollment = MagicMock()
    mock_enrollment.is_present = False
    mock_enrollment.user.name = "Jefferson"
    mock_enrollment.event.title = "Sistemas Distribuidos"
    
    service.repo.get_by_token.return_value = mock_enrollment
    service.repo.confirm_attendance.return_value = mock_enrollment
    
    result = service.validate_attendance(qr_token="token_xyz", staff_id="admin")
    
    assert result["status"] == "success"
    assert result["data"]["student_name"] == "Jefferson"