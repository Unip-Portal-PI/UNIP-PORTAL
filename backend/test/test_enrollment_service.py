"""
test_enrollment_service.py — Testes unitários do EnrollmentService.

Cobre os fluxos de:
- Inscrição com validações de prazo, capacidade e conflito de horário
- Validação de presença via QR Code
- Check-in manual
- Consultas e relatórios
"""

import pytest
from unittest.mock import MagicMock
from datetime import date, datetime, timezone

from business.services.enrollment_service import EnrollmentService


# ==============================================================================
# FIXTURE LOCAL
# ==============================================================================

@pytest.fixture
def enrollment_service(mock_enrollment_repo, mock_audit_repo, mock_event_repo):
    return EnrollmentService(
        enrollment_repo=mock_enrollment_repo,
        audit_repo=mock_audit_repo,
        event_repo=mock_event_repo
    )


# ==============================================================================
# TESTES: INSCRIÇÃO EM EVENTO (enroll_user)
# ==============================================================================

class TestEnrollUser:

    def test_enroll_success(
        self, enrollment_service, mock_event_repo, mock_enrollment_repo,
        mock_audit_repo, fake_event, fake_enrollment
    ):
        """Inscrição válida deve persistir e retornar o objeto de inscrição."""
        mock_event_repo.get_by_id.return_value = fake_event
        mock_enrollment_repo.check_time_conflict.return_value = False
        mock_enrollment_repo.create.return_value = fake_enrollment

        result = enrollment_service.enroll_user(user_id=1, event_id=fake_event.id)

        assert result == fake_enrollment
        mock_event_repo.increment_occupancy.assert_called_once_with(fake_event.id)
        mock_audit_repo.log_action.assert_called_once()

    def test_enroll_event_not_found(self, enrollment_service, mock_event_repo):
        """Evento inexistente deve retornar 'event_not_found'."""
        mock_event_repo.get_by_id.return_value = None

        result = enrollment_service.enroll_user(user_id=1, event_id=999)

        assert result == "event_not_found"

    def test_enroll_deadline_exceeded(self, enrollment_service, mock_event_repo, fake_event):
        """Prazo de inscrição expirado deve retornar 'deadline_exceeded'."""
        fake_event.deadline_date = date(2000, 1, 1)  # Data no passado
        mock_event_repo.get_by_id.return_value = fake_event

        result = enrollment_service.enroll_user(user_id=1, event_id=fake_event.id)

        assert result == "deadline_exceeded"

    def test_enroll_no_slots_available(self, enrollment_service, mock_event_repo, fake_event):
        """Evento sem vagas deve retornar 'no_slots_available'."""
        fake_event.occupied_slots = fake_event.total_slots  # Sem vagas
        mock_event_repo.get_by_id.return_value = fake_event

        result = enrollment_service.enroll_user(user_id=1, event_id=fake_event.id)

        assert result == "no_slots_available"

    def test_enroll_time_conflict(
        self, enrollment_service, mock_event_repo, mock_enrollment_repo, fake_event
    ):
        """Conflito de horário deve retornar 'time_conflict'."""
        mock_event_repo.get_by_id.return_value = fake_event
        mock_enrollment_repo.check_time_conflict.return_value = True

        result = enrollment_service.enroll_user(user_id=1, event_id=fake_event.id)

        assert result == "time_conflict"

    def test_enroll_already_enrolled(
        self, enrollment_service, mock_event_repo, mock_enrollment_repo, fake_event
    ):
        """Inscrição duplicada deve retornar 'already_enrolled'."""
        mock_event_repo.get_by_id.return_value = fake_event
        mock_enrollment_repo.check_time_conflict.return_value = False
        mock_enrollment_repo.create.return_value = "already_enrolled"

        result = enrollment_service.enroll_user(user_id=1, event_id=fake_event.id)

        assert result == "already_enrolled"
        # Não deve incrementar vagas nem auditar
        mock_event_repo.increment_occupancy.assert_not_called()

    def test_enroll_does_not_increment_slots_on_failure(
        self, enrollment_service, mock_event_repo, mock_enrollment_repo, fake_event
    ):
        """Em caso de falha na criação, vagas não devem ser incrementadas."""
        mock_event_repo.get_by_id.return_value = fake_event
        mock_enrollment_repo.check_time_conflict.return_value = False
        mock_enrollment_repo.create.return_value = None

        enrollment_service.enroll_user(user_id=1, event_id=fake_event.id)

        mock_event_repo.increment_occupancy.assert_not_called()


# ==============================================================================
# TESTES: VALIDAÇÃO DE PRESENÇA VIA QR CODE (validate_attendance)
# ==============================================================================

class TestValidateAttendance:

    def test_validate_attendance_success(
        self, enrollment_service, mock_enrollment_repo, mock_audit_repo, fake_enrollment
    ):
        """QR Code válido e presença não confirmada deve registrar check-in."""
        fake_enrollment.is_present = False
        updated = MagicMock()
        updated.user.name = "João Silva"
        updated.user_id = 1
        updated.user.registration_number = "RA12345"
        updated.user.nickname = "joao"
        updated.user.area = "Computação"
        updated.event.title = "Semana de TI"
        updated.present_at = datetime.now(timezone.utc)

        mock_enrollment_repo.get_by_token.return_value = fake_enrollment
        mock_enrollment_repo.confirm_attendance.return_value = updated

        result = enrollment_service.validate_attendance("token-uuid-abc123", staff_id="2")

        assert isinstance(result, dict)
        assert result["status"] == "success"
        assert result["data"]["student_name"] == "João Silva"
        mock_audit_repo.log_action.assert_called_once()

    def test_validate_attendance_invalid_token(self, enrollment_service, mock_enrollment_repo):
        """Token inválido deve retornar 'invalid_token'."""
        mock_enrollment_repo.get_by_token.return_value = None

        result = enrollment_service.validate_attendance("token-invalido", staff_id="2")

        assert result == "invalid_token"

    def test_validate_attendance_already_validated(
        self, enrollment_service, mock_enrollment_repo, fake_enrollment
    ):
        """Presença já confirmada deve retornar 'already_validated'."""
        fake_enrollment.is_present = True
        mock_enrollment_repo.get_by_token.return_value = fake_enrollment

        result = enrollment_service.validate_attendance("token-uuid-abc123", staff_id="2")

        assert result == "already_validated"
        mock_enrollment_repo.confirm_attendance.assert_not_called()

    def test_validate_attendance_update_fails(
        self, enrollment_service, mock_enrollment_repo, fake_enrollment
    ):
        """Falha ao confirmar no banco deve retornar 'error_updating'."""
        fake_enrollment.is_present = False
        mock_enrollment_repo.get_by_token.return_value = fake_enrollment
        mock_enrollment_repo.confirm_attendance.return_value = None

        result = enrollment_service.validate_attendance("token-uuid-abc123", staff_id="2")

        assert result == "error_updating"


# ==============================================================================
# TESTES: CHECK-IN MANUAL (manual_checkin)
# ==============================================================================

class TestManualCheckin:

    def test_manual_checkin_success(
        self, enrollment_service, mock_enrollment_repo, mock_audit_repo
    ):
        """Check-in manual com ID válido deve retornar a inscrição atualizada."""
        updated = MagicMock()
        mock_enrollment_repo.confirm_attendance.return_value = updated

        result = enrollment_service.manual_checkin(enrollment_id=5, staff_id="2")

        assert result == updated
        mock_audit_repo.log_action.assert_called_once()
        call_kwargs = mock_audit_repo.log_action.call_args[1]
        assert call_kwargs["action"] == "MANUAL_CHECKIN"

    def test_manual_checkin_already_confirmed(self, enrollment_service, mock_enrollment_repo):
        """Presença já confirmada deve retornar 'already_validated'."""
        mock_enrollment_repo.confirm_attendance.return_value = "already_confirmed"

        result = enrollment_service.manual_checkin(enrollment_id=5, staff_id="2")

        assert result == "already_validated"

    def test_manual_checkin_not_found(self, enrollment_service, mock_enrollment_repo):
        """ID de inscrição inexistente deve retornar 'not_found'."""
        mock_enrollment_repo.confirm_attendance.return_value = None

        result = enrollment_service.manual_checkin(enrollment_id=9999, staff_id="2")

        assert result == "not_found"


# ==============================================================================
# TESTES: RELATÓRIO DE PRESENÇA (get_event_attendance_list)
# ==============================================================================

class TestAttendanceReport:

    def test_get_event_attendance_list_success(
        self, enrollment_service, mock_event_repo, mock_enrollment_repo, fake_event
    ):
        """Relatório deve contar presentes e listar todos os inscritos."""
        mock_event_repo.get_by_id.return_value = fake_event

        # 3 inscritos: 2 presentes, 1 ausente
        e1 = MagicMock(is_present=True, present_at=datetime.now(timezone.utc))
        e1.user.name = "Aluno 1"
        e1.user.registration_number = "RA001"
        e1.user.area = "TI"

        e2 = MagicMock(is_present=True, present_at=datetime.now(timezone.utc))
        e2.user.name = "Aluno 2"
        e2.user.registration_number = "RA002"
        e2.user.area = "TI"

        e3 = MagicMock(is_present=False, present_at=None)
        e3.user.name = "Aluno 3"
        e3.user.registration_number = "RA003"
        e3.user.area = "ADM"

        mock_enrollment_repo.list_by_event.return_value = [e1, e2, e3]

        result = enrollment_service.get_event_attendance_list(fake_event.id)

        assert isinstance(result, dict)
        assert result["total_enrolled"] == 3
        assert result["total_present"] == 2
        assert len(result["attendees"]) == 3

    def test_get_event_attendance_list_event_not_found(
        self, enrollment_service, mock_event_repo
    ):
        """Evento inexistente deve retornar 'event_not_found'."""
        mock_event_repo.get_by_id.return_value = None

        result = enrollment_service.get_event_attendance_list(9999)

        assert result == "event_not_found"

    def test_get_my_enrollments(self, enrollment_service, mock_enrollment_repo):
        """Listagem de inscrições do aluno deve delegar ao repositório."""
        enrollments = [MagicMock(), MagicMock()]
        mock_enrollment_repo.list_by_user.return_value = enrollments

        result = enrollment_service.get_my_enrollments(user_id=1)

        assert result == enrollments
        mock_enrollment_repo.list_by_user.assert_called_once_with(1)
