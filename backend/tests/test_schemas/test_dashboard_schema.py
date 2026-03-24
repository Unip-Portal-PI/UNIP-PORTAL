import pytest
from datetime import datetime
from pydantic import ValidationError
from schemas.dashboard_schema import StudentDashboardResponse
from schemas.enrollment_schema import EnrollmentResponse
from schemas.news_schema import NewsResponse
from schemas.internship_schema import InternshipResponse

@pytest.fixture
def enrollment():
    return EnrollmentResponse(
        id=1, user_id=1, event_id=1, qr_code_token="token123",
        enrolled_at=datetime.now(), is_present=False
    )

@pytest.fixture
def news():
    return NewsResponse(
        id=1, title="Comunicado", content="Conteúdo com mais de 10 caracteres",
        created_at=datetime.now(), is_active=True, status="published",
        author_id=1, version=1
    )

@pytest.fixture
def internship():
    return InternshipResponse(
        id=1, company="Empresa", position="Desenvolvedor", location="SP",
        start_date=datetime.now(), status="Ativo", is_active=True,
        author_id=1, version=1, created_at=datetime.now()
    )

def test_dashboard_valid(enrollment, news, internship):
    schema = StudentDashboardResponse(
        my_enrollments=[enrollment],
        latest_news=[news],
        recent_internships=[internship]
    )
    assert len(schema.my_enrollments) == 1

def test_dashboard_empty_lists():
    schema = StudentDashboardResponse(
        my_enrollments=[], latest_news=[], recent_internships=[]
    )
    assert schema.my_enrollments == []

def test_dashboard_missing_field(enrollment, news):
    with pytest.raises(ValidationError):
        StudentDashboardResponse(
            my_enrollments=[enrollment],
            latest_news=[news]
        )