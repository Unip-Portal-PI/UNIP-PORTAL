import pytest
from datetime import datetime
from pydantic import ValidationError
from schemas.audit_schema import AuditLogResponse

def test_audit_log_valid():
    schema = AuditLogResponse(
        id=1, user_id="123", action="CREATE", table_name="users",
        description="Usuário criado", timestamp=datetime.now()
    )
    assert schema.id == 1

def test_audit_log_description_none():
    schema = AuditLogResponse(
        id=2, user_id="456", action="DELETE", table_name="events",
        description=None, timestamp=datetime.now()
    )
    assert schema.description is None

def test_audit_log_without_description_raises_error():
    with pytest.raises(ValidationError):
        AuditLogResponse(
            id=3, user_id="789", action="UPDATE",
            table_name="courses", timestamp=datetime.now()
        )

def test_audit_log_missing_user_id():
    with pytest.raises(ValidationError):
        AuditLogResponse(
            id=4, action="CREATE", table_name="users", timestamp=datetime.now()
        )