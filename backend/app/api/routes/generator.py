"""
API routes for document generation.
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.core.exceptions import DocumentGenerationError, ImageProcessingError
from app.core.logging import logger
from app.models import GenerateDocumentRequest, GenerateDocumentResponse
from app.services import document_generator, file_manager, image_processor


router = APIRouter(prefix="/generator", tags=["Generator"])


@router.post(
    "/generate",
    response_model=GenerateDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Word document",
    description="Generates a Word document with the provided images",
)
async def generate_document(
    request: GenerateDocumentRequest,
) -> GenerateDocumentResponse:
    """
    Generate a Word document with the provided images.

    - **images**: List of images in base64 format
    - **config**: Document configuration (optional)
    """
    try:
        logger.info(f"Generation request: {len(request.images)} images")

        # 1. Process images
        processed_images = image_processor.process_multiple(request.images)

        # 2. Generate document
        result = document_generator.generate(processed_images, request.config)

        # 3. Return response
        return GenerateDocumentResponse(
            success=True,
            filename=result.filename,
            path=str(result.path.absolute()),
            pages=result.pages,
            images_placed=result.images_placed,
            file_size_kb=result.file_size_kb,
        )

    except ImageProcessingError as e:
        logger.error(f"Error processing images: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.to_dict(),
        ) from e

    except DocumentGenerationError as e:
        logger.error(f"Error generating document: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=e.to_dict(),
        ) from e


@router.get(
    "/download/{filename}",
    summary="Download document",
    description="Downloads a previously generated document",
    responses={
        200: {
            "description": "Document file",
            "content": {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {}
            },
        },
        404: {"description": "File not found"},
    },
)
async def download_document(filename: str) -> FileResponse:
    """
    Download a generated document.

    - **filename**: Name of the file to download
    """
    try:
        file_path = file_manager.get_file_path(filename)

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {filename}",
        ) from e


@router.get(
    "/files",
    summary="List files",
    description="Lists recently generated documents",
)
async def list_files(limit: int = 20) -> dict:
    """
    List generated documents.

    - **limit**: Maximum number of files to list
    """
    files = file_manager.list_files(limit=limit)
    return {"files": files, "count": len(files)}


@router.delete(
    "/files/{filename}",
    summary="Delete file",
    description="Deletes a generated document",
)
async def delete_file(filename: str) -> dict:
    """
    Delete a document.

    - **filename**: Name of the file to delete
    """
    try:
        file_manager.delete_file(filename)
        return {"success": True, "message": f"File {filename} deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
