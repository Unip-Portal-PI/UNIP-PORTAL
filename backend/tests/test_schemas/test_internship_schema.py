import pytest
from datetime import datetime
from pydantic import ValidationError
from schemas.internship_schema import InternshipCreate, InternshipUpdate, InternshipResponse

@pytest.fixture
def valid_data():
    return {
        "company": "Empresa Tech",
        "position": "Desenvolvedor",
        "location": "São Paulo",
        "start_date": datetime(2024, 1, 15)
    }

# TESTES CREATE

def test_create_valid(valid_data):
    schema = InternshipCreate(**valid_data)
    assert schema.company == "Empresa Tech"

def test_create_company_too_short(valid_data):
    data = valid_data.copy()
    data["company"] = "A"
    with pytest.raises(ValidationError):
        InternshipCreate(**data)

def test_create_description_optional(valid_data):
    schema = InternshipCreate(**valid_data)
    assert schema.description is None

def test_create_end_date_optional(valid_data):
    schema = InternshipCreate(**valid_data)
    assert schema.end_date is None

# TESTES UPDATE

def test_update_valid(valid_data):
    data = {**valid_data, "current_version": 1}
    schema = InternshipUpdate(**data)
    assert schema.current_version == 1

def test_update_missing_version(valid_data):
    with pytest.raises(ValidationError):
        InternshipUpdate(**valid_data)

# TESTES RESPONSE

def test_response_valid(valid_data):
    data = {
        **valid_data,
        "id": 1, "status": "Ativo", "is_active": True,
        "author_id": 1, "version": 1, "created_at": datetime.now()
    }
    schema = InternshipResponse(**data)
    assert schema.id == 1

def test_response_missing_fields():
    with pytest.raises(ValidationError):
        InternshipResponse(id=1, company="Empresa")