import pytest
import os
from unittest.mock import Mock, patch, mock_open
from business.services.storage_service import StorageService


@pytest.fixture
def storage_service():
    with patch("os.makedirs"):
        yield StorageService()


@pytest.mark.anyio
async def test_save_banner_generates_unique_path(storage_service):
    mock_file = Mock()
    mock_file.filename = "evento_unip.png"
    async def mock_read(): return b"fake_binary_content"
    mock_file.read.side_effect = mock_read

    with patch("builtins.open", mock_open()) as mocked_file:
        with patch("uuid.uuid4", return_value="test-uuid-123"):
            result = await storage_service.save_banner(mock_file)
            
            assert result == "/static/banners/test-uuid-123.png"
            mocked_file.assert_called_once()
            mocked_file().write.assert_called_once_with(b"fake_binary_content")


@pytest.mark.anyio
async def test_save_banner_handles_exception(storage_service):
    mock_file = Mock()
    mock_file.filename = "erro.jpg"  # ← ADICIONADO: filename necessário
    async def mock_read(): return b"data"
    mock_file.read.side_effect = mock_read

    with patch("builtins.open", side_effect=IOError("Disk Full")):
        with pytest.raises(IOError, match="Disk Full"):
            await storage_service.save_banner(mock_file)


def test_init_creates_directory():
    with patch("os.makedirs") as mock_mkdir:
        StorageService()
        mock_mkdir.assert_called_once_with("static/banners", exist_ok=True)