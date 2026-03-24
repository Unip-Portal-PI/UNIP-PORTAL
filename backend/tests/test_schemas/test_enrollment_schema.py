import pytest
from datetime import datetime, date
from pydantic import ValidationError
from schemas.enrollment_schema import (
    EnrollmentCreate, AttendanceCheck, EnrollmentResponse,
    AttendanceDetail, EventAttendanceReport
)

# TESTES ENROLLMENTCREATE

def test_enrollment_create_valid():
    schema = EnrollmentCreate(event_id=1)
    assert schema.event_id == 1

def test_enrollment_create_missing_event_id():
    with pytest.raises(ValidationError):
        EnrollmentCreate()

# TESTES ATTENDANCECHECK

def test_attendance_check_valid():
    schema = AttendanceCheck(qr_code_token="token123")
    assert schema.qr_code_token == "token123"

def test_attendance_check_missing_token():
    with pytest.raises(ValidationError):
        AttendanceCheck()

# TESTES ENROLLMENTRESPONSE

def test_enrollment_response_valid():
    schema = EnrollmentResponse(
        id=1, user_id=1, event_id=1, qr_code_token="token123",
        enrolled_at=datetime.now(), is_present=False
    )
    assert schema.id == 1

def test_enrollment_response_optional_fields():
    schema = EnrollmentResponse(
        id=1, user_id=1, event_id=1, qr_code_token="token123",
        enrolled_at=datetime.now(), is_present=False,
        event_name=None, student_name=None
    )
    assert schema.event_name is None

# TESTES ATTENDANCEDETAIL

def test_attendance_detail_valid():
    schema = AttendanceDetail(
        name="João", registration="123", area="Computação", is_present=True
    )
    assert schema.name == "João"

def test_attendance_detail_missing_fields():
    with pytest.raises(ValidationError):
        AttendanceDetail(name="João")

# TESTES EVENTATTENDANCEREPORT

def test_event_attendance_report_valid():
    schema = EventAttendanceReport(
        event_title="Evento", total_enrolled=10, total_present=5, attendees=[]
    )
    assert schema.event_title == "Evento"

def test_event_attendance_report_missing_fields():
    with pytest.raises(ValidationError):
        EventAttendanceReport(event_title="Evento")