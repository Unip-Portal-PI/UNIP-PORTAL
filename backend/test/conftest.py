"""
conftest.py — Fixtures globais compartilhadas entre todos os testes.
Centraliza a criação de mocks e objetos reutilizáveis.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import date, datetime, timezone


# ==============================================================================
# FIXTURES DE REPOSITÓRIOS (MOCKS)
# ==============================================================================

@pytest.fixture
def mock_user_repo():
    return MagicMock()


@pytest.fixture
def mock_audit_repo():
    return MagicMock()


@pytest.fixture
def mock_email_service():
    return MagicMock()


@pytest.fixture
def mock_enrollment_repo():
    return MagicMock()


@pytest.fixture
def mock_event_repo():
    return MagicMock()


@pytest.fixture
def mock_news_repo():
    return MagicMock()


@pytest.fixture
def mock_internship_repo():
    return MagicMock()


# ==============================================================================
# FIXTURES DE OBJETOS DE DOMÍNIO (DADOS FAKE)
# ==============================================================================

@pytest.fixture
def fake_user():
    """Retorna um objeto UserModel simulado e já ativo."""
    user = MagicMock()
    user.id = 1
    user.name = "João Silva"
    user.nickname = "joao"
    user.email = "joao@teste.com"
    user.registration_number = "RA12345"
    user.password_hash = "$argon2id$v=19$..."
    user.role = "student"
    user.is_active = True
    user.otp_code = None
    user.area = "Computação"
    user.phone = "11999999999"
    user.birth_date = date(2000, 1, 15)
    return user


@pytest.fixture
def fake_admin_user():
    user = MagicMock()
    user.id = 99
    user.name = "Admin Master"
    user.nickname = "admin"
    user.email = "admin@teste.com"
    user.registration_number = "RA00001"
    user.password_hash = "$argon2id$v=19$..."
    user.role = "admin"
    user.is_active = True
    user.otp_code = None
    user.area = "TI"
    return user


@pytest.fixture
def fake_event():
    """Retorna um objeto EventModel simulado com vagas disponíveis."""
    event = MagicMock()
    event.id = 10
    event.title = "Semana de TI"
    event.area = "Computação"
    event.location = "Auditório A"
    event.total_slots = 100
    event.occupied_slots = 50
    event.is_active = True
    event.registration_type = "internal"
    event.external_url = None
    event.event_date = date.today().replace(year=date.today().year + 1)
    event.deadline_date = date.today().replace(year=date.today().year + 1)
    event.start_time = "08:00"
    event.shift = "Manhã"
    event.has_vacancies = True
    event.is_registration_closed = False
    return event


@pytest.fixture
def fake_enrollment(fake_user, fake_event):
    """Retorna um objeto EnrollmentModel simulado."""
    enrollment = MagicMock()
    enrollment.id = 5
    enrollment.user_id = fake_user.id
    enrollment.event_id = fake_event.id
    enrollment.user = fake_user
    enrollment.event = fake_event
    enrollment.qr_code_token = "token-uuid-abc123"
    enrollment.is_present = False
    enrollment.present_at = None
    enrollment.enrolled_at = datetime.now(timezone.utc)
    return enrollment


@pytest.fixture
def fake_internship():
    internship = MagicMock()
    internship.id = 1
    internship.company = "TechCorp"
    internship.position = "Estagiário de Backend"
    internship.description = "Trabalhar com Python e FastAPI"
    internship.location = "Remoto"
    internship.start_date = datetime(2025, 6, 1)
    internship.end_date = datetime(2025, 12, 31)
    internship.is_active = True
    return internship


@pytest.fixture
def fake_news():
    news = MagicMock()
    news.id = "uuid-news-001"
    news.title = "Novo Calendário Acadêmico"
    news.summary = "Confira as datas do semestre."
    news.content = "O calendário foi publicado com todas as datas."
    news.author_id = "uuid-admin-001"
    news.is_active = True
    news.version = 1
    return news
