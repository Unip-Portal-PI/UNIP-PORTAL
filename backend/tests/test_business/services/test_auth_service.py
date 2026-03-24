import pytest
from unittest.mock import Mock, MagicMock, patch, ANY
from fastapi import HTTPException
from business.services.auth_service import AuthService


@pytest.fixture
def setup_service():
    mock_user_repo = Mock()
    mock_audit_repo = Mock()
    mock_email_service = Mock()
    mock_user_repo.db = MagicMock()
    
    service = AuthService(
        repo=mock_user_repo,
        audit_repo=mock_audit_repo,
        email_service=mock_email_service
    )
    return service, mock_user_repo, mock_audit_repo, mock_email_service


def test_register_first_user_as_admin(setup_service):
    service, user_repo, audit_repo, _ = setup_service
    
    user_repo.count_users.return_value = 0
    user_repo.get_by_email.return_value = None
    user_repo.get_by_registration.return_value = None
    user_repo.create.side_effect = lambda u: u
    
    result = service.register(
        name="Admin Root", nickname="root", registration_number="001",
        email="admin@unip.br", password="password123", area="TI"
    )
    
    assert result.role == "admin"
    assert result.is_active is True
    audit_repo.log_action.assert_called_once()


def test_register_student_requires_otp(setup_service):
    service, user_repo, _, email_service = setup_service
    
    user_repo.count_users.return_value = 10
    user_repo.get_by_email.return_value = None
    user_repo.get_by_registration.return_value = None
    user_repo.create.side_effect = lambda u: u
    
    result = service.register(
        name="Aluno Teste", nickname="aluno", registration_number="202401",
        email="aluno@unip.br", password="password123", area="Engenharia"
    )
    
    assert result.role == "student"
    assert result.is_active is False
    assert result.otp_code is not None
    email_service.send_verification_code.assert_called_once()


@patch("business.services.auth_service.verify_password")
@patch("business.services.auth_service.create_access_token")
def test_login_success(mock_create_token, mock_verify_pwd, setup_service):
    service, user_repo, _, _ = setup_service
    
    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.is_active = True
    mock_user.password_hash = "hashed_secret"
    mock_user.role = "student"
    mock_user.name = "Teste"
    mock_user.nickname = "testinho"
    
    user_repo.get_by_registration.return_value = mock_user
    mock_verify_pwd.return_value = True
    mock_create_token.return_value = "fake-jwt-token"
    
    response = service.login("202401", "password123")
    
    assert response["access_token"] == "fake-jwt-token"
    assert response["nickname"] == "testinho"


def test_login_inactive_user_raises_exception(setup_service):
    service, user_repo, _, _ = setup_service
    
    mock_user = MagicMock()
    mock_user.is_active = False
    user_repo.get_by_registration.return_value = mock_user
    
    with patch("business.services.auth_service.verify_password", return_value=True):
        with pytest.raises(HTTPException) as excinfo:
            service.login("202401", "password123")
        
        assert excinfo.value.status_code == 403


def test_activate_account_success(setup_service):
    service, user_repo, audit_repo, _ = setup_service
    
    mock_user = MagicMock()
    mock_user.id = 50
    mock_user.otp_code = "123456"
    user_repo.get_by_email.return_value = mock_user
    
    success = service.activate_account("aluno@unip.br", "123456")
    
    assert success is True
    assert mock_user.is_active is True
    user_repo.db.commit.assert_called_once()