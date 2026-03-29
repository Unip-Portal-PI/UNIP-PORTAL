import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.core.security import RoleChecker
from app.core.storage import build_file_url, storage_service

router = APIRouter(prefix="/files", tags=["Arquivos"])
logger = logging.getLogger("app.files")

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])


@router.post("/upload", status_code=201)
def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("images"),
    current_user=Depends(allow_colaborador_adm),
):
    try:
        path = storage_service.upload_image(file=file, folder=folder)
        logger.info("upload_success user_id=%s filename=%s folder=%s", current_user.id_usuario, file.filename, folder)
        return {
            "path": path,
            "url": build_file_url(path),
            "filename": file.filename,
            "content_type": file.content_type,
        }
    except Exception as exc:
        logger.error("upload_failure user_id=%s filename=%s error=%s", current_user.id_usuario, file.filename, exc, exc_info=True)
        raise


@router.get("/{object_path:path}")
def get_file(
    object_path: str,
):
    try:
        response = storage_service.get_object(object_path)
    except Exception as exc:
        logger.error("get_file_failure path=%s error=%s", object_path, exc, exc_info=True)
        raise

    headers = {"Content-Disposition": f'inline; filename="{object_path.rsplit("/", 1)[-1]}"'}

    def iter_chunks():
        try:
            yield from response.stream(32 * 1024)
        finally:
            response.close()
            response.release_conn()

    return StreamingResponse(
        iter_chunks(),
        media_type=response.headers.get("Content-Type", "application/octet-stream"),
        headers=headers,
    )
