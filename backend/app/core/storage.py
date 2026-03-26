from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class MinioStorageService:
    def __init__(self) -> None:
        self.bucket = settings.MINIO_BUCKET
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

    def ensure_bucket(self) -> None:
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as exc:
            raise HTTPException(
                status_code=500,
                detail="Nao foi possivel inicializar o bucket de arquivos.",
            ) from exc

    def upload_image(self, file: UploadFile, folder: str = "images") -> str:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Arquivo invalido.")

        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Arquivo vazio.")

        extension = Path(file.filename).suffix.lower()
        object_name = f"{folder.strip('/')}/{uuid4().hex}{extension}"

        try:
            self.client.put_object(
                self.bucket,
                object_name,
                data=BytesIO(content),
                length=len(content),
                content_type=file.content_type or "application/octet-stream",
            )
        except S3Error as exc:
            raise HTTPException(
                status_code=500,
                detail="Nao foi possivel enviar o arquivo para o storage.",
            ) from exc

        return object_name

    def get_object(self, object_name: str):
        try:
            return self.client.get_object(self.bucket, object_name)
        except S3Error as exc:
            status_code = 404 if exc.code == "NoSuchKey" else 500
            detail = "Arquivo nao encontrado." if status_code == 404 else "Nao foi possivel recuperar o arquivo."
            raise HTTPException(status_code=status_code, detail=detail) from exc


storage_service = MinioStorageService()


def build_file_url(path: str | None) -> str | None:
    if not path:
        return None

    normalized_path = path.strip()
    if not normalized_path:
        return None

    if normalized_path.startswith(("http://", "https://", "/files/")):
        return normalized_path

    return f"/files/{normalized_path}"


def extract_file_path(value: str | None) -> str | None:
    if not value:
        return None

    normalized_value = value.strip()
    if not normalized_value:
        return None

    if "/files/" in normalized_value:
        return normalized_value.split("/files/", 1)[1]

    return normalized_value
