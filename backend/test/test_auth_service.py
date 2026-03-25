"""
test_auth_service.py — Testes unitários do AuthService.

Cobre os fluxos de:
- Registro de usuário (primeiro usuário vira admin, demais ficam inativos)
- Ativação de conta via OTP
- Login por matrícula
- Recuperação de senha (forgot password)
- Troca de senha com usuário logado
- Atualização de perfil e role
- Deleção de usuário
"""

import pytest
from unittest.mock import MagicMock, patch, call
from datetime import date

from business.services.auth_service import AuthService


# ==============================================================================
# FIXTURES LOCAIS
# ==============================================================================

@pytest.fixture
def auth_service(mock_user_repo, mock_audit_repo, mock_email_service):
    return AuthService(
        repo=mock_user_repo,
        audit_repo=mock_audit_repo,
        email_service=mock_email_service
    )


# ==============================================================================
# TESTES: REGISTRO DE USUÁRIO
# ==============================================================================

class TestRegister:

    def test_register_first_user_becomes_admin(self, auth_service, mock_user_repo, mock_audit_repo):
        """O primeiro usuário cadastrado deve receber role 'admin' e conta ativa."""
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.get_by_registration.return_value = None
        mock_user_repo.count_users.return_value = 0

        created_user = MagicMock()
        created_user.email = "admin@teste.com"
        created_user.registration_number = "RA001"
        mock_user_repo.create.return_value = created_user

        result = auth_service.register(
            name="Admin",
            nickname="adm",
            registration_number="RA001",
            email="admin@teste.com",
            password="Senha123",
            area="TI"
        )

        assert result == created_user
        # Verifica que o modelo criado tem role admin e está ativo
        created_model = mock_user_repo.create.call_args[0][0]
        assert created_model.role == "admin"
        assert created_model.is_active is True
        assert created_model.otp_code is None

    def test_register_subsequent_user_becomes_student_inactive(
        self, auth_service, mock_user_repo, mock_email_service
    ):
        """Usuários além do primeiro devem ser 'student', inativos e receber OTP por e-mail."""
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.get_by_registration.return_value = None
        mock_user_repo.count_users.return_value = 5

        created_user = MagicMock()
        created_user.email = "aluno@teste.com"
        created_user.registration_number = "RA999"
        mock_user_repo.create.return_value = created_user

        result = auth_service.register(
            name="Aluno",
            nickname="alu",
            registration_number="RA999",
            email="aluno@teste.com",
            password="Senha123",
            area="Computação"
        )

        assert result == created_user
        created_model = mock_user_repo.create.call_args[0][0]
        assert created_model.role == "student"
        assert created_model.is_active is False
        assert created_model.otp_code is not None
        # E-mail de verificação deve ser enviado
        mock_email_service.send_verification_code.assert_called_once()

    def test_register_duplicate_email_returns_none(self, auth_service, mock_user_repo):
        """Registro com e-mail já existente deve retornar None (sem criar usuário)."""
        mock_user_repo.get_by_email.return_value = MagicMock()  # e-mail já existe
        mock_user_repo.get_by_registration.return_value = None

        result = auth_service.register(
            name="Fulano",
            nickname="ful",
            registration_number="RA555",
            email="duplicado@teste.com",
            password="Senha123",
            area="Direito"
        )

        assert result is None
        mock_user_repo.create.assert_not_called()

    def test_register_duplicate_registration_returns_none(self, auth_service, mock_user_repo):
        """Registro com matrícula já existente deve retornar None."""
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.get_by_registration.return_value = MagicMock()  # matrícula duplicada

        result = auth_service.register(
            name="Ciclano",
            nickname="cic",
            registration_number="RA_EXISTENTE",
            email="novo@teste.com",
            password="Senha123",
            area="Medicina"
        )

        assert result is None
        mock_user_repo.create.assert_not_called()

    def test_register_normalizes_email_to_lowercase(self, auth_service, mock_user_repo, mock_audit_repo):
        """E-mail deve ser normalizado para lowercase antes de salvar."""
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.get_by_registration.return_value = None
        mock_user_repo.count_users.return_value = 1

        created_user = MagicMock()
        created_user.email = "usuario@teste.com"
        created_user.registration_number = "RA100"
        mock_user_repo.create.return_value = created_user

        auth_service.register(
            name="Teste",
            nickname="tes",
            registration_number="RA100",
            email="USUARIO@TESTE.COM",
            password="Senha123",
            area="Engenharia"
        )

        created_model = mock_user_repo.create.call_args[0][0]
        assert created_model.email == "usuario@teste.com"

    def test_register_logs_audit_on_success(
        self, auth_service, mock_user_repo, mock_audit_repo
    ):
        """Registro bem-sucedido deve gerar log de auditoria."""
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.get_by_registration.return_value = None
        mock_user_repo.count_users.return_value = 1

        created_user = MagicMock()
        created_user.email = "novo@teste.com"
        created_user.registration_number = "RA777"
        mock_user_repo.create.return_value = created_user

        auth_service.register(
            name="Novo",
            nickname="nov",
            registration_number="RA777",
            email="novo@teste.com",
            password="Senha123",
            area="Arquitetura"
        )

        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "CREATE_USER"


# ==============================================================================
# TESTES: ATIVAÇÃO DE CONTA
# ==============================================================================

class TestActivateAccount:

    def test_activate_account_with_correct_otp(self, auth_service, mock_user_repo, mock_audit_repo):
        """Ativação com OTP correto deve ativar conta e limpar o código."""
        user = MagicMock()
        user.id = 1
        user.otp_code = "123456"
        user.is_active = False
        mock_user_repo.get_by_email.return_value = user
        mock_user_repo.db = MagicMock()

        result = auth_service.activate_account("user@teste.com", "123456")

        assert result is True
        assert user.is_active is True
        assert user.otp_code is None
        mock_user_repo.db.commit.assert_called_once()
        mock_audit_repo.log_action.assert_called_once()

    def test_activate_account_with_wrong_otp_returns_false(self, auth_service, mock_user_repo):
        """OTP incorreto deve retornar False sem ativar a conta."""
        user = MagicMock()
        user.otp_code = "999999"
        mock_user_repo.get_by_email.return_value = user

        result = auth_service.activate_account("user@teste.com", "000000")

        assert result is False

    def test_activate_account_user_not_found_returns_false(self, auth_service, mock_user_repo):
        """E-mail não cadastrado deve retornar False."""
        mock_user_repo.get_by_email.return_value = None

        result = auth_service.activate_account("naoexiste@teste.com", "123456")

        assert result is False


# ==============================================================================
# TESTES: LOGIN
# ==============================================================================

class TestLogin:

    def test_login_with_valid_credentials_returns_token(self, auth_service, mock_user_repo, fake_user):
        """Login com credenciais válidas deve retornar token JWT e dados do usuário."""
        fake_user.is_active = True
        mock_user_repo.get_by_registration.return_value = fake_user

        with patch("business.services.auth_service.verify_password", return_value=True), \
             patch("business.services.auth_service.create_access_token", return_value="jwt.token.aqui"):
            result = auth_service.login("RA12345", "Senha123")

        assert result is not None
        assert result["access_token"] == "jwt.token.aqui"
        assert result["token_type"] == "bearer"
        assert result["role"] == fake_user.role
        assert result["nickname"] == fake_user.nickname

    def test_login_with_wrong_password_returns_none(self, auth_service, mock_user_repo, fake_user):
        """Senha incorreta deve retornar None."""
        mock_user_repo.get_by_registration.return_value = fake_user

        with patch("business.services.auth_service.verify_password", return_value=False):
            result = auth_service.login("RA12345", "SenhaErrada")

        assert result is None

    def test_login_with_nonexistent_registration_returns_none(self, auth_service, mock_user_repo):
        """Matrícula não encontrada deve retornar None."""
        mock_user_repo.get_by_registration.return_value = None

        result = auth_service.login("RA_INEXISTENTE", "Senha123")

        assert result is None

    def test_login_with_inactive_account_raises_403(self, auth_service, mock_user_repo, fake_user):
        """Conta inativa deve lançar HTTPException 403."""
        from fastapi import HTTPException
        fake_user.is_active = False
        mock_user_repo.get_by_registration.return_value = fake_user

        with patch("business.services.auth_service.verify_password", return_value=True):
            with pytest.raises(HTTPException) as exc_info:
                auth_service.login("RA12345", "Senha123")

        assert exc_info.value.status_code == 403


# ==============================================================================
# TESTES: RECUPERAÇÃO DE SENHA (FORGOT PASSWORD)
# ==============================================================================

class TestForgotPassword:

    def test_request_otp_by_email_sends_code(
        self, auth_service, mock_user_repo, mock_email_service
    ):
        """Solicitação de OTP para e-mail existente deve gerar código e enviar e-mail."""
        user = MagicMock()
        user.id = 1
        user.email = "user@teste.com"
        mock_user_repo.get_by_email.return_value = user
        mock_user_repo.db = MagicMock()

        result = auth_service.request_otp_by_email("user@teste.com")

        assert result is not None
        assert len(result) == 6
        assert result.isdigit()
        mock_email_service.send_verification_code.assert_called_once_with(user.email, result)

    def test_request_otp_unknown_email_returns_none(self, auth_service, mock_user_repo):
        """E-mail não cadastrado deve retornar None sem enviar e-mail."""
        mock_user_repo.get_by_email.return_value = None

        result = auth_service.request_otp_by_email("naoexiste@teste.com")

        assert result is None

    def test_recover_password_with_correct_otp(self, auth_service, mock_user_repo, mock_audit_repo):
        """Recuperação com OTP correto deve alterar a senha e limpar o código."""
        user = MagicMock()
        user.id = 1
        user.otp_code = "654321"
        mock_user_repo.get_by_email.return_value = user
        mock_user_repo.db = MagicMock()

        with patch("business.services.auth_service.hash_password", return_value="novo_hash"):
            result = auth_service.recover_password_with_otp(
                "user@teste.com", "654321", "NovaSenha123"
            )

        assert result is True
        assert user.password_hash == "novo_hash"
        assert user.otp_code is None
        mock_audit_repo.log_action.assert_called_once()

    def test_recover_password_with_wrong_otp_returns_false(self, auth_service, mock_user_repo):
        """OTP incorreto na recuperação deve retornar False."""
        user = MagicMock()
        user.otp_code = "111111"
        mock_user_repo.get_by_email.return_value = user

        result = auth_service.recover_password_with_otp("user@teste.com", "999999", "NovaSenha")

        assert result is False


# ==============================================================================
# TESTES: TROCA DE SENHA (USUÁRIO LOGADO)
# ==============================================================================

class TestPasswordChange:

    def test_request_password_change_otp_sends_email(
        self, auth_service, mock_user_repo, mock_email_service
    ):
        """Solicitação de troca de senha logado deve gerar e enviar OTP."""
        user = MagicMock()
        user.id = 1
        user.email = "samufdev@gmail.com"
        mock_user_repo.get_by_id.return_value = user
        mock_user_repo.db = MagicMock()

        result = auth_service.request_password_change_otp(1)

        assert result is True
        mock_email_service.send_verification_code.assert_called_once()

    def test_request_password_change_otp_user_not_found(self, auth_service, mock_user_repo):
        """ID inexistente deve retornar False."""
        mock_user_repo.get_by_id.return_value = None

        result = auth_service.request_password_change_otp(9999)

        assert result is False

    def test_confirm_password_change_with_correct_otp(self, auth_service, mock_user_repo):
        """Confirmação com OTP correto deve alterar a senha."""
        user = MagicMock()
        user.id = 1
        user.otp_code = "112233"
        mock_user_repo.get_by_id.return_value = user
        mock_user_repo.db = MagicMock()

        with patch("business.services.auth_service.hash_password", return_value="hash_novo"):
            result = auth_service.confirm_password_change(1, "112233", "NovaSenha1")

        assert result is True
        assert user.password_hash == "hash_novo"
        assert user.otp_code is None

    def test_confirm_password_change_wrong_otp_returns_false(self, auth_service, mock_user_repo):
        """OTP inválido na confirmação deve retornar False."""
        user = MagicMock()
        user.otp_code = "000000"
        mock_user_repo.get_by_id.return_value = user

        result = auth_service.confirm_password_change(1, "999999", "NovaSenha1")

        assert result is False


# ==============================================================================
# TESTES: GESTÃO ADMINISTRATIVA
# ==============================================================================

class TestAdminManagement:

    def test_update_user_access_valid_role(self, auth_service, mock_user_repo, mock_audit_repo):
        """Alteração de role válida deve retornar 'success'."""
        mock_user_repo.change_user_role.return_value = True

        result = auth_service.update_user_access(admin_id=1, target_user_id=2, new_role="staff")

        assert result == "success"
        mock_audit_repo.log_action.assert_called_once()

    def test_update_user_access_invalid_role(self, auth_service, mock_user_repo):
        """Role inválida deve retornar 'invalid_role' sem tocar no banco."""
        result = auth_service.update_user_access(admin_id=1, target_user_id=2, new_role="superuser")

        assert result == "invalid_role"
        mock_user_repo.change_user_role.assert_not_called()

    def test_update_user_access_user_not_found(self, auth_service, mock_user_repo):
        """Usuário alvo inexistente deve retornar 'user_not_found'."""
        mock_user_repo.change_user_role.return_value = False

        result = auth_service.update_user_access(admin_id=1, target_user_id=9999, new_role="admin")

        assert result == "user_not_found"

    def test_delete_user_prevents_self_deletion(self, auth_service):
        """Admin não deve conseguir desativar a própria conta."""
        result = auth_service.delete_user(target_user_id=5, current_user_id=5)

        assert result == "self_delete_forbidden"

    def test_delete_user_success(self, auth_service, mock_user_repo, mock_audit_repo):
        """Deleção de outro usuário deve retornar o resultado do repo e logar auditoria."""
        mock_user_repo.delete.return_value = True

        result = auth_service.delete_user(target_user_id=3, current_user_id=1)

        assert result is True
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "DELETE_USER"

    def test_delete_user_not_found_returns_falsy(self, auth_service, mock_user_repo):
        """Tentativa de deletar usuário inexistente deve retornar valor falsy."""
        mock_user_repo.delete.return_value = False

        result = auth_service.delete_user(target_user_id=9999, current_user_id=1)

        assert not result
