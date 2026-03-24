import pytest
from unittest.mock import patch
from business.services.email_service import EmailService


@pytest.fixture
def email_service():
    with patch("business.services.email_service.settings") as mock_settings:
        mock_settings.RESEND_API_KEY = "re_test_123"
        mock_settings.EMAIL_FROM = "no-reply@unip-portal.edu.br"
        mock_settings.OTP_EXPIRATION_MINUTES = 10
        yield EmailService()


def test_send_verification_code_params(email_service):
    with patch("resend.Emails.send") as mock_send:
        mock_send.return_value = {"id": "email_id_123"}
        
        result = email_service.send_verification_code("aluno@unip.br", "123456")
        
        assert result is True
        mock_send.assert_called_once()
        
        args = mock_send.call_args[0][0]
        assert args["to"] == ["aluno@unip.br"]
        assert "123456" in args["subject"]
        assert "123456" in args["html"]


def test_send_verification_code_fallback(email_service):
    with patch("resend.Emails.send", side_effect=Exception("API Error")):
        with patch("builtins.print"):
            result = email_service.send_verification_code("test@test.com", "999888")
            assert result is True


def test_code_formatting(email_service):
    with patch("resend.Emails.send") as mock_send:
        email_service.send_verification_code("test@test.com", " 12345678 ")
        
        args = mock_send.call_args[0][0]
        assert "123456" in args["subject"]