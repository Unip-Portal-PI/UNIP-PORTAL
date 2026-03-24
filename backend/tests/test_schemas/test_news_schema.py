import pytest
from datetime import datetime
from pydantic import ValidationError
from schemas.news_schema import (
    NewsCreate, NewsUpdate, NewsResponse,
    NewsReadResponse, NewsReadCreate
)

# FIXTURES

@pytest.fixture
def valid_news():
    return {
        "title": "Comunicado Oficial",
        "content": "Conteúdo com mais de 10 caracteres",
        "image_url": "https://exemplo.com/imagem.jpg"
    }

# TESTES NEWSCREATE

def test_news_create_valid(valid_news):
    schema = NewsCreate(**valid_news)
    assert schema.title == "Comunicado Oficial"

def test_news_create_title_too_short(valid_news):
    data = valid_news.copy()
    data["title"] = "ABC"
    with pytest.raises(ValidationError):
        NewsCreate(**data)

def test_news_create_content_too_short(valid_news):
    data = valid_news.copy()
    data["content"] = "ABC"
    with pytest.raises(ValidationError):
        NewsCreate(**data)

def test_news_create_image_optional(valid_news):
    data = valid_news.copy()
    del data["image_url"]
    schema = NewsCreate(**data)
    assert schema.image_url is None

# TESTES NEWSUPDATE

def test_news_update_valid(valid_news):
    data = {**valid_news, "current_version": 1}
    schema = NewsUpdate(**data)
    assert schema.current_version == 1

def test_news_update_missing_version(valid_news):
    with pytest.raises(ValidationError):
        NewsUpdate(**valid_news)

# TESTES NEWSRESPONSE

def test_news_response_valid(valid_news):
    data = {
        **valid_news,
        "id": 1,
        "created_at": datetime.now(),
        "is_active": True,
        "status": "published",
        "author_id": 1,
        "version": 1
    }
    schema = NewsResponse(**data)
    assert schema.id == 1

def test_news_response_required_fields():
    with pytest.raises(ValidationError):
        NewsResponse(id=1, title="Teste")

# TESTES NEWSREAD

def test_news_read_response_valid():
    schema = NewsReadResponse(
        news_id=1,
        user_id=1,
        read_at=datetime.now()
    )
    assert schema.news_id == 1

def test_news_read_create_valid():
    schema = NewsReadCreate(news_id=1)
    assert schema.news_id == 1

def test_news_read_create_missing_news_id():
    with pytest.raises(ValidationError):
        NewsReadCreate()

# EXECUÇÃO
if __name__ == "__main__":
    pytest.main([__file__, "-v"])