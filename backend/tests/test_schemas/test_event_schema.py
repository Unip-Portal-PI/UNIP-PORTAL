import pytest
from datetime import datetime, date
from pydantic import ValidationError
from schemas.event_schema import EventCreate, EventResponse, AttachmentCreate

# TESTES ATTACHMENT

def test_attachment_create_valid():
    schema = AttachmentCreate(name="doc.pdf", url="https://exemplo.com/doc.pdf")
    assert schema.name == "doc.pdf"

def test_attachment_missing_name():
    with pytest.raises(ValidationError):
        AttachmentCreate(url="https://exemplo.com/doc.pdf")

# TESTES EVENTCREATE

def test_event_create_valid():
    schema = EventCreate(
        title="Evento", event_date=date(2024, 12, 15), start_time="14:00",
        shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
        total_slots=50
    )
    assert schema.title == "Evento"

def test_event_create_title_too_short():
    with pytest.raises(ValidationError):
        EventCreate(
            title="AB", event_date=date(2024, 12, 15), start_time="14:00",
            shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
            total_slots=50
        )

def test_event_create_invalid_time():
    with pytest.raises(ValidationError):
        EventCreate(
            title="Evento", event_date=date(2024, 12, 15), start_time="14:00:00",
            shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
            total_slots=50
        )

def test_event_create_negative_slots():
    with pytest.raises(ValidationError):
        EventCreate(
            title="Evento", event_date=date(2024, 12, 15), start_time="14:00",
            shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
            total_slots=-5
        )

def test_event_create_with_attachments():
    schema = EventCreate(
        title="Evento", event_date=date(2024, 12, 15), start_time="14:00",
        shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
        total_slots=50, attachments=[AttachmentCreate(name="doc.pdf", url="https://exemplo.com/doc.pdf")]
    )
    assert len(schema.attachments) == 1

# TESTES EVENTRESPONSE

def test_event_response_valid():
    schema = EventResponse(
        id=1, title="Evento", event_date=date(2024, 12, 15), start_time="14:00",
        shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
        total_slots=50, owner_id=1, created_at=datetime.now()
    )
    assert schema.id == 1

def test_event_response_missing_fields():
    with pytest.raises(ValidationError):
        EventResponse(id=1, title="Evento")

def test_event_response_default_values():
    schema = EventResponse(
        id=1, title="Evento", event_date=date(2024, 12, 15), start_time="14:00",
        shift="Tarde", location="Local", deadline_date=date(2024, 12, 10),
        total_slots=50, owner_id=1, created_at=datetime.now()
    )
    assert schema.occupied_slots == 0
    assert schema.is_active is True