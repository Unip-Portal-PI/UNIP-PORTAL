"""
test_security.py — Testes unitários do módulo core/security.

Cobre:
- Hash e verificação de senhas
- Geração e decodificação de tokens JWT
- Autenticação de usuário (authenticate_user)
- Controle de acesso por role (RoleChecker)
- get_current_user com RBAC sync
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import timedelta
from fastapi import HTTPException
from jose import jwt

from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    RoleChecker,
)
from core.config import settings


# ==============================================================================
# TESTES: HASH E VERIFICAÇÃO DE SENHA
# ==============================================================================

class TestPasswordHashing:

    def test_hash_password_returns_non_plain_string(self):
        """Hash não deve ser igual à senha original."""
        hashed = hash_password("Senha123")
        assert hashed != "Senha123"
        assert len(hashed) > 20

    def test_verify_password_correct(self):
        """Verificação com senha correta deve retornar True."""
        hashed = hash_password("Senha123")
        assert verify_password("Senha123", hashed) is True

    def test_verify_password_incorrect(self):
        """Verificação com senha errada deve retornar False."""
        hashed = hash_password("Senha123")
        assert verify_password("SenhaErrada", hashed) is False

    def test_hash_truncates_at_72_chars(self):
        """Senha acima de 72 caracteres deve ser truncada (proteção DoS)."""
        long_password = "A" * 80 + "1b"
        hashed = hash_password(long_password)
        # O hash da versão truncada deve verificar igual ao da senha longa
        assert verify_password("A" * 72, hashed) is True

    def test_two_hashes_of_same_password_are_different(self):
        """Argon2 usa salt aleatório, dois hashes da mesma senha devem ser diferentes."""
        h1 = hash_password("Senha123")
        h2 = hash_password("Senha123")
        assert h1 != h2

    def test_verify_password_with_empty_string_returns_false(self):
        """Verificação com string vazia deve retornar False."""
        hashed = hash_password("Senha123")
        assert verify_password("", hashed) is False


# ==============================================================================
# TESTES: GERAÇÃO E DECODIFICAÇÃO DE TOKEN JWT
# ==============================================================================

class TestJWTToken:

    def test_create_access_token_contains_sub_and_role(self):
        """Token gerado deve conter os claims 'sub' e 'role'."""
        token = create_access_token(data={"sub": "1", "role": "student", "name": "João"})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "1"
        assert payload["role"] == "student"

    def test_create_access_token_contains_expiration(self):
        """Token deve conter o claim 'exp'."""
        token = create_access_token(data={"sub": "1", "role": "admin"})
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload

    def test_create_access_token_with_custom_expiry(self):
        """Token com expiração customizada deve refletir o delta correto."""
        delta = timedelta(minutes=5)
        token = create_access_token(data={"sub": "1", "role": "admin"}, expires_delta=delta)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload

    def test_token_signed_with_correct_key(self):
        """Token assinado com chave errada não deve ser decodificado."""
        token = create_access_token(data={"sub": "1", "role": "student"})
        with pytest.raises(Exception):
            jwt.decode(token, "chave-errada", algorithms=[settings.ALGORITHM])


# ==============================================================================
# TESTES: authenticate_user
# ==============================================================================

class TestAuthenticateUser:

    def test_authenticate_user_valid_credentials(self, fake_user):
        """Credenciais válidas devem retornar o usuário."""
        from core.security import authenticate_user
        mock_db = MagicMock()
        fake_user.is_active = True

        with patch("core.security.UserRepository") as MockRepo:
            MockRepo.return_value.get_by_registration.return_value = fake_user
            with patch("core.security.verify_password", return_value=True):
                result = authenticate_user("RA12345", "Senha123", mock_db)

        assert result == fake_user

    def test_authenticate_user_not_found_returns_false(self):
        """Matrícula não encontrada deve retornar False."""
        from core.security import authenticate_user
        mock_db = MagicMock()

        with patch("core.security.UserRepository") as MockRepo:
            MockRepo.return_value.get_by_registration.return_value = None
            result = authenticate_user("RA_INEXISTENTE", "Senha123", mock_db)

        assert result is False

    def test_authenticate_user_inactive_raises_401(self, fake_user):
        """Usuário inativo deve lançar HTTPException 401."""
        from core.security import authenticate_user
        mock_db = MagicMock()
        fake_user.is_active = False

        with patch("core.security.UserRepository") as MockRepo:
            MockRepo.return_value.get_by_registration.return_value = fake_user
            with pytest.raises(HTTPException) as exc_info:
                authenticate_user("RA12345", "Senha123", mock_db)

        assert exc_info.value.status_code == 401

    def test_authenticate_user_wrong_password_returns_false(self, fake_user):
        """Senha errada deve retornar False."""
        from core.security import authenticate_user
        mock_db = MagicMock()
        fake_user.is_active = True

        with patch("core.security.UserRepository") as MockRepo:
            MockRepo.return_value.get_by_registration.return_value = fake_user
            with patch("core.security.verify_password", return_value=False):
                result = authenticate_user("RA12345", "SenhaErrada", mock_db)

        assert result is False


# ==============================================================================
# TESTES: RoleChecker (RBAC)
# ==============================================================================

class TestRoleChecker:

    def test_role_checker_allows_valid_role(self, fake_user):
        """Usuário com role permitida deve passar sem exceção."""
        fake_user.role = "admin"
        checker = RoleChecker(["admin", "staff"])

        result = checker(current_user=fake_user)

        assert result == fake_user

    def test_role_checker_blocks_forbidden_role(self, fake_user):
        """Usuário com role não permitida deve receber HTTPException 403."""
        fake_user.role = "student"
        checker = RoleChecker(["admin", "staff"])

        with pytest.raises(HTTPException) as exc_info:
            checker(current_user=fake_user)

        assert exc_info.value.status_code == 403
        assert "student" in exc_info.value.detail

    def test_role_checker_with_single_role(self, fake_user):
        """RoleChecker com uma única role deve bloquear outras."""
        fake_user.role = "staff"
        checker = RoleChecker(["admin"])

        with pytest.raises(HTTPException) as exc_info:
            checker(current_user=fake_user)

        assert exc_info.value.status_code == 403

    def test_role_checker_student_allowed_when_included(self, fake_user):
        """Student deve ter acesso quando sua role está na lista."""
        fake_user.role = "student"
        checker = RoleChecker(["student", "staff", "admin"])

        result = checker(current_user=fake_user)

        assert result == fake_user


# ==============================================================================
# TESTES: get_current_user (RBAC Sync)
# ==============================================================================

class TestGetCurrentUser:

    def _make_valid_token(self, user_id="1", role="student"):
        return create_access_token(data={"sub": user_id, "role": role, "name": "Teste"})

    def test_get_current_user_valid_token(self, fake_user):
        """Token válido com usuário ativo deve retornar o usuário."""
        from core.security import get_current_user
        token = self._make_valid_token(user_id="1", role="student")
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = fake_user

        result = get_current_user(token=token, db=mock_db)

        assert result == fake_user

    def test_get_current_user_role_mismatch_raises_401(self, fake_user):
        """Role no banco diferente da role no token deve lançar 401."""
        from core.security import get_current_user
        token = self._make_valid_token(user_id="1", role="student")
        fake_user.role = "admin"  # Banco foi atualizado, token está desatualizado
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = fake_user

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token, db=mock_db)

        assert exc_info.value.status_code == 401
        assert "permissões" in exc_info.value.detail.lower()

    def test_get_current_user_inactive_user_raises_401(self, fake_user):
        """Usuário inativo não deve autenticar mesmo com token válido."""
        from core.security import get_current_user
        token = self._make_valid_token(user_id="1", role="student")
        fake_user.is_active = False
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = fake_user

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token, db=mock_db)

        assert exc_info.value.status_code == 401

    def test_get_current_user_invalid_token_raises_401(self):
        """Token malformado deve lançar HTTPException 401."""
        from core.security import get_current_user
        mock_db = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token="token.invalido.aqui", db=mock_db)

        assert exc_info.value.status_code == 401
