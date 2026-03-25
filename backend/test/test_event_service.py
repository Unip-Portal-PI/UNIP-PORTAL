"""
test_event_service.py — Testes unitários do EventService.

Cobre os fluxos de:
- Criação com validações de data e tipo de inscrição
- Atualização com validações de negócio
- Remoção e auditoria
- Verificação de disponibilidade
"""

import pytest
from unittest.mock import MagicMock
from datetime import date, timedelta

from business.services.event_service import EventService


# ==============================================================================
# FIXTURE LOCAL
# ==============================================================================

@pytest.fixture
def event_service(mock_event_repo, mock_audit_repo):
    return EventService(repo=mock_event_repo, audit_repo=mock_audit_repo)


@pytest.fixture
def valid_event_data():
    """Dados mínimos válidos para criação de um evento."""
    future = date.today() + timedelta(days=30)
    return {
        "title": "Workshop de Python",
        "area": "Computação",
        "location": "Sala 201",
        "event_date": future,
        "deadline_date": future,
        "start_time": "14:00",
        "shift": "Tarde",
        "total_slots": 50,
        "registration_type": "internal",
        "external_url": None,
    }


# ==============================================================================
# TESTES: CRIAÇÃO DE EVENTO (create_event)
# ==============================================================================

class TestCreateEvent:

    def test_create_event_success(
        self, event_service, mock_event_repo, mock_audit_repo, valid_event_data
    ):
        """Criação com dados válidos deve persistir e logar auditoria."""
        created = MagicMock()
        created.title = "Workshop de Python"
        created.total_slots = 50
        created.location = "Sala 201"
        created.area = "Computação"
        mock_event_repo.create.return_value = created

        result = event_service.create_event(valid_event_data, admin_id=1)

        assert result == created
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "CREATE"
        assert call_kwargs["table_name"] == "events"

    def test_create_event_with_past_date_raises_value_error(
        self, event_service, valid_event_data
    ):
        """Data de evento no passado deve lançar ValueError."""
        valid_event_data["event_date"] = date(2000, 1, 1)

        with pytest.raises(ValueError, match="passado"):
            event_service.create_event(valid_event_data, admin_id=1)

    def test_create_event_external_without_url_raises_value_error(
        self, event_service, valid_event_data
    ):
        """Evento externo sem URL deve lançar ValueError."""
        valid_event_data["registration_type"] = "external"
        valid_event_data["external_url"] = None

        with pytest.raises(ValueError, match="URL"):
            event_service.create_event(valid_event_data, admin_id=1)

    def test_create_event_external_with_empty_url_raises_value_error(
        self, event_service, valid_event_data
    ):
        """URL em branco para evento externo também deve lançar ValueError."""
        valid_event_data["registration_type"] = "external"
        valid_event_data["external_url"] = "   "

        with pytest.raises(ValueError):
            event_service.create_event(valid_event_data, admin_id=1)

    def test_create_event_external_with_valid_url_succeeds(
        self, event_service, mock_event_repo, mock_audit_repo, valid_event_data
    ):
        """Evento externo com URL válida deve ser criado com sucesso."""
        valid_event_data["registration_type"] = "external"
        valid_event_data["external_url"] = "https://inscricoes.exemplo.com"

        created = MagicMock()
        created.title = "Workshop de Python"
        created.total_slots = 50
        created.location = "Sala 201"
        created.area = "Computação"
        mock_event_repo.create.return_value = created

        result = event_service.create_event(valid_event_data, admin_id=1)

        assert result is not None

    def test_create_event_with_string_date_is_parsed(
        self, event_service, mock_event_repo, mock_audit_repo, valid_event_data
    ):
        """Data em formato string ISO deve ser convertida para date corretamente."""
        future_str = (date.today() + timedelta(days=10)).isoformat()
        valid_event_data["event_date"] = future_str

        created = MagicMock()
        created.title = "Workshop de Python"
        created.total_slots = 50
        created.location = "Sala 201"
        created.area = "Computação"
        mock_event_repo.create.return_value = created

        result = event_service.create_event(valid_event_data, admin_id=1)

        assert result is not None


# ==============================================================================
# TESTES: ATUALIZAÇÃO DE EVENTO (update_event)
# ==============================================================================

class TestUpdateEvent:

    def test_update_event_success(
        self, event_service, mock_event_repo, mock_audit_repo
    ):
        """Atualização válida deve retornar o evento atualizado e logar."""
        updated = MagicMock()
        updated.title = "Título Novo"
        mock_event_repo.update.return_value = updated

        result = event_service.update_event(
            event_id=10,
            event_data={"title": "Título Novo"},
            admin_id=1
        )

        assert result == updated
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "UPDATE"

    def test_update_event_not_found_returns_none(self, event_service, mock_event_repo):
        """Evento não encontrado deve retornar None."""
        mock_event_repo.update.return_value = None

        result = event_service.update_event(
            event_id=9999,
            event_data={"title": "Qualquer"},
            admin_id=1
        )

        assert result is None

    def test_update_event_to_external_without_url_raises_value_error(
        self, event_service
    ):
        """Alterar para externo sem URL deve lançar ValueError."""
        with pytest.raises(ValueError, match="URL"):
            event_service.update_event(
                event_id=10,
                event_data={"registration_type": "external", "external_url": ""},
                admin_id=1
            )


# ==============================================================================
# TESTES: REMOÇÃO DE EVENTO (delete_event)
# ==============================================================================

class TestDeleteEvent:

    def test_delete_event_success(
        self, event_service, mock_event_repo, mock_audit_repo
    ):
        """Remoção bem-sucedida deve retornar True e logar auditoria."""
        mock_event_repo.delete.return_value = True

        result = event_service.delete_event(event_id=10, admin_id=1)

        assert result is True
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "DELETE"

    def test_delete_event_not_found_returns_false(self, event_service, mock_event_repo):
        """Evento inexistente deve retornar False sem logar."""
        mock_event_repo.delete.return_value = False

        result = event_service.delete_event(event_id=9999, admin_id=1)

        assert result is False


# ==============================================================================
# TESTES: VERIFICAÇÃO DE DISPONIBILIDADE (check_availability)
# ==============================================================================

class TestCheckAvailability:

    def test_availability_event_not_found(self, event_service, mock_event_repo):
        """Evento inexistente deve retornar available=False com razão."""
        mock_event_repo.get_by_id.return_value = None

        result = event_service.check_availability(9999)

        assert result["available"] is False
        assert "não encontrado" in result["reason"]

    def test_availability_external_event_returns_url(self, event_service, mock_event_repo):
        """Evento externo deve retornar URL de inscrição."""
        event = MagicMock()
        event.registration_type = "external"
        event.external_url = "https://inscricoes.exemplo.com"
        mock_event_repo.get_by_id.return_value = event

        result = event_service.check_availability(10)

        assert result["available"] is True
        assert result["external"] is True
        assert result["url"] == "https://inscricoes.exemplo.com"

    def test_availability_inactive_event(self, event_service, mock_event_repo):
        """Evento inativo deve retornar available=False."""
        event = MagicMock()
        event.registration_type = "internal"
        event.is_active = False
        mock_event_repo.get_by_id.return_value = event

        result = event_service.check_availability(10)

        assert result["available"] is False

    def test_availability_registration_closed(self, event_service, mock_event_repo):
        """Evento com prazo encerrado deve retornar available=False."""
        event = MagicMock()
        event.registration_type = "internal"
        event.is_active = True
        event.is_registration_closed = True
        mock_event_repo.get_by_id.return_value = event

        result = event_service.check_availability(10)

        assert result["available"] is False
        assert "prazo" in result["reason"].lower()

    def test_availability_no_vacancies(self, event_service, mock_event_repo):
        """Evento sem vagas deve retornar available=False."""
        event = MagicMock()
        event.registration_type = "internal"
        event.is_active = True
        event.is_registration_closed = False
        event.has_vacancies = False
        mock_event_repo.get_by_id.return_value = event

        result = event_service.check_availability(10)

        assert result["available"] is False
        assert "vagas" in result["reason"].lower()

    def test_availability_open_with_slots(self, event_service, mock_event_repo):
        """Evento aberto com vagas deve retornar available=True e número de vagas."""
        event = MagicMock()
        event.registration_type = "internal"
        event.is_active = True
        event.is_registration_closed = False
        event.has_vacancies = True
        event.total_slots = 100
        event.occupied_slots = 60
        mock_event_repo.get_by_id.return_value = event

        result = event_service.check_availability(10)

        assert result["available"] is True
        assert result["slots_left"] == 40
