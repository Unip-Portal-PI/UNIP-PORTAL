import pytest
from unittest.mock import Mock
from business.services.dashboard_service import DashboardService


@pytest.fixture
def setup_service():
    mock_enroll = Mock()
    mock_news = Mock()
    mock_intern = Mock()
    service = DashboardService(
        enrollment_repo=mock_enroll,
        news_repo=mock_news,
        internship_repo=mock_intern
    )
    return service, mock_enroll, mock_news, mock_intern


def test_get_student_summary_success(setup_service):
    service, enroll_repo, news_repo, intern_repo = setup_service
    
    enroll_repo.list_by_user.return_value = ["i1", "i2"]
    news_repo.list.return_value = ["n1", "n2", "n3"]
    intern_repo.list.return_value = ["e1"]
    
    result = service.get_student_summary(user_id=1)
    
    assert len(result["my_enrollments"]) == 2
    assert len(result["latest_news"]) == 3
    assert len(result["recent_internships"]) == 1
    
    news_repo.list.assert_called_once_with(skip=0, limit=3)
    intern_repo.list.assert_called_once_with(skip=0, limit=3)


def test_get_student_summary_handles_none(setup_service):
    service, enroll_repo, news_repo, intern_repo = setup_service
    
    enroll_repo.list_by_user.return_value = None
    news_repo.list.return_value = None
    intern_repo.list.return_value = None
    
    result = service.get_student_summary(user_id=1)
    
    assert result["my_enrollments"] == []
    assert result["latest_news"] == []
    assert result["recent_internships"] == []


def test_get_student_summary_invalid_user_id(setup_service):
    service, _, _, _ = setup_service
    
    result = service.get_student_summary(user_id="abc")
    
    assert result["my_enrollments"] == []