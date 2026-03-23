from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse

from app.core.security import RoleChecker
from app.core.storage import build_file_url, storage_service

router = APIRouter(prefix="/files", tags=["Arquivos"])

allow_colaborador_adm = RoleChecker(["colaborador", "adm"])


@router.post("/upload", status_code=201)
def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("images"),
    current_user=Depends(allow_colaborador_adm),
):
    path = storage_service.upload_image(file=file, folder=folder)
    return {
        "path": path,
        "url": build_file_url(path),
        "filename": file.filename,
        "content_type": file.content_type,
    }


@router.get("/{object_path:path}")
def get_file(
    object_path: str,
):
    response = storage_service.get_object(object_path)
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
