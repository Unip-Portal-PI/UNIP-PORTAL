"""
test_models_and_schemas.py — Testes das propriedades lógicas dos Models
e das validações dos Schemas Pydantic.

Cobre:
- Propriedades calculadas do EventModel (Corrigido para evitar erro de _sa_instance_state)
- Validações do UserCreate (senha, telefone)
- Validações do UserVerifyOTP
- Validações do EventBase (formato de horário)
"""

import pytest
from pydantic import ValidationError
from datetime import date, timedelta, datetime

# Importações dos Schemas e Models
from schemas.user_schema import UserCreate, UserUpdateSelf, UserVerifyOTP
from persistence.models.event_model import EventModel


# ==============================================================================
# TESTES: EventModel — Propriedades Lógicas
# ==============================================================================

class TestEventModelProperties:
    """
    Testa as propriedades calculadas do EventModel diretamente.
    Utiliza o construtor padrão para garantir a compatibilidade com o SQLAlchemy.
    """

    def _make_event(self, event_date, deadline_date, occupied=0, total=100):
        """
        Cria uma instância de EventModel usando o construtor padrão.
        Isso evita o erro de '_sa_instance_state'.
        """
        return EventModel(
            title="Evento de Teste",
            location="Local de Teste",
            shift="Manhã",
            start_time="08:00",
            owner_id=1,
            event_date=event_date,
            deadline_date=deadline_date,
            occupied_slots=occupied,
            total_slots=total
        )

    def test_is_expired_past_event(self):
        """Evento no passado deve ser marcado como expirado."""
        event = self._make_event(
            event_date=date(2000, 1, 1),
            deadline_date=date(2000, 1, 1)
        )
        assert event.is_expired is True

    def test_is_expired_future_event(self):
        """Evento no futuro não deve ser expirado."""
        future = date.today() + timedelta(days=30)
        event = self._make_event(event_date=future, deadline_date=future)
        assert event.is_expired is False

    def test_is_registration_closed_past_deadline(self):
        """Prazo no passado deve indicar inscrições fechadas."""
        event = self._make_event(
            event_date=date.today() + timedelta(days=5),
            deadline_date=date(2000, 1, 1)
        )
        assert event.is_registration_closed is True

    def test_is_registration_closed_future_deadline(self):
        """Prazo no futuro deve indicar inscrições abertas."""
        future = date.today() + timedelta(days=10)
        event = self._make_event(event_date=future, deadline_date=future)
        assert event.is_registration_closed is False

    def test_has_vacancies_with_slots_available(self):
        """Evento com vagas disponíveis deve retornar True."""
        event = self._make_event(
            event_date=date.today() + timedelta(days=5),
            deadline_date=date.today() + timedelta(days=5),
            occupied=50,
            total=100
        )
        assert event.has_vacancies is True

    def test_has_vacancies_when_full(self):
        """Evento com todas as vagas ocupadas deve retornar False."""
        event = self._make_event(
            event_date=date.today() + timedelta(days=5),
            deadline_date=date.today() + timedelta(days=5),
            occupied=100,
            total=100
        )
        assert event.has_vacancies is False

    def test_slots_left_calculation(self):
        """slots_left deve retornar a diferença correta entre total e ocupado."""
        event = self._make_event(
            event_date=date.today() + timedelta(days=5),
            deadline_date=date.today() + timedelta(days=5),
            occupied=30,
            total=100
        )
        assert event.slots_left == 70

    def test_slots_left_zero_when_overbooked(self):
        """slots_left nunca deve ser negativo."""
        event = self._make_event(
            event_date=date.today() + timedelta(days=5),
            deadline_date=date.today() + timedelta(days=5),
            occupied=150,
            total=100
        )
        assert event.slots_left == 0


# ==============================================================================
# TESTES: UserCreate Schema — Validações de Senha
# ==============================================================================

class TestUserCreateSchema:

    def _valid_payload(self, **overrides):
        base = {
            "name": "João Silva",
            "nickname": "joao",
            "registration_number": "RA12345",
            "email": "joao@teste.com",
            "password": "Senha123",
            "area": "Computação",
        }
        base.update(overrides)
        return base

    def test_valid_user_create(self):
        """Payload completo e válido deve ser aceito sem erros."""
        user = UserCreate(**self._valid_payload())
        assert user.name == "João Silva"
        assert user.email == "joao@teste.com"

    def test_password_without_uppercase_raises(self):
        """Senha sem maiúscula deve ser rejeitada."""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**self._valid_payload(password="senha123"))
        assert "maiúscula" in str(exc_info.value)

    def test_password_without_lowercase_raises(self):
        """Senha sem minúscula deve ser rejeitada."""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**self._valid_payload(password="SENHA123"))
        assert "minúscula" in str(exc_info.value)

    def test_password_without_digit_raises(self):
        """Senha sem número deve ser rejeitada."""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**self._valid_payload(password="SenhaSemNum"))
        assert "número" in str(exc_info.value)

    def test_password_too_short_raises(self):
        """Senha com menos de 8 caracteres deve ser rejeitada."""
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(password="Ab1"))

    def test_phone_strips_non_digits(self):
        """Telefone deve ter caracteres não numéricos removidos."""
        user = UserCreate(**self._valid_payload(phone="(11) 99999-9999"))
        assert user.phone == "11999999999"

    def test_phone_none_is_accepted(self):
        """Telefone é campo opcional."""
        user = UserCreate(**self._valid_payload(phone=None))
        assert user.phone is None

    def test_invalid_email_raises(self):
        """E-mail malformado deve ser rejeitado."""
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(email="email-invalido"))

    def test_name_too_short_raises(self):
        """Nome com menos de 3 caracteres deve ser rejeitado."""
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(name="Jo"))

    def test_registration_too_short_raises(self):
        """Matrícula com menos de 5 caracteres deve ser rejeitada."""
        with pytest.raises(ValidationError):
            UserCreate(**self._valid_payload(registration_number="RA1"))


# ==============================================================================
# TESTES: UserVerifyOTP Schema
# ==============================================================================

class TestUserVerifyOTPSchema:

    def test_valid_otp(self):
        """OTP de 6 dígitos numéricos deve ser aceito."""
        data = UserVerifyOTP(email="user@teste.com", otp_code="123456")
        assert data.otp_code == "123456"

    def test_otp_with_letters_raises(self):
        """OTP com letras deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            UserVerifyOTP(email="user@teste.com", otp_code="12345A")
        assert "números" in str(exc_info.value)

    def test_otp_too_short_raises(self):
        """OTP com menos de 6 dígitos deve ser rejeitado."""
        with pytest.raises(ValidationError):
            UserVerifyOTP(email="user@teste.com", otp_code="12345")

    def test_otp_too_long_raises(self):
        """OTP com mais de 6 dígitos deve ser rejeitado."""
        with pytest.raises(ValidationError):
            UserVerifyOTP(email="user@teste.com", otp_code="1234567")


# ==============================================================================
# TESTES: UserUpdateSelf Schema
# ==============================================================================

class TestUserUpdateSelfSchema:

    def test_all_optional_fields_can_be_none(self):
        """Todos os campos do update são opcionais."""
        update = UserUpdateSelf()
        assert update.name is None
        assert update.email is None
        assert update.phone is None

    def test_phone_update_strips_non_digits(self):
        """Telefone na atualização deve ser sanitizado."""
        update = UserUpdateSelf(phone="+55 (21) 98765-4321")
        assert update.phone == "5521987654321"

    def test_nickname_too_short_raises(self):
        """Nickname com menos de 2 caracteres deve ser rejeitado."""
        with pytest.raises(ValidationError):
            UserUpdateSelf(nickname="A")