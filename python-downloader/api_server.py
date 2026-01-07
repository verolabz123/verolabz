"""
FastAPI Server for Cloud Downloader Service

This server provides REST API endpoints for downloading files from cloud storage services.
It integrates with the Node.js backend to handle problematic cloud URLs.

Usage:
    python api_server.py

Endpoints:
    POST /download - Download file from URL
    POST /download-and-extract - Download and extract text with OCR
    GET /health - Health check
"""

import asyncio
import base64
import io
import logging
import os
import sys
from typing import Optional

import uvicorn
from cloud_downloader import CloudDownloader
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Cloud Downloader API",
    description="Download resume files from Google Drive, Dropbox, OneDrive, and other cloud storage",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request models
class DownloadRequest(BaseModel):
    url: str = Field(..., description="URL to download from", min_length=1)
    max_size_mb: Optional[int] = Field(
        50, description="Maximum file size in MB", ge=1, le=100
    )


class DownloadAndExtractRequest(BaseModel):
    url: str = Field(..., description="URL to download from", min_length=1)
    max_size_mb: Optional[int] = Field(
        50, description="Maximum file size in MB", ge=1, le=100
    )
    extract_text: Optional[bool] = Field(True, description="Extract text using OCR")


# Response models
class DownloadResponse(BaseModel):
    success: bool
    filename: Optional[str] = None
    size: Optional[int] = None
    content_type: Optional[str] = None
    provider: Optional[str] = None
    content_base64: Optional[str] = None  # Base64 encoded file content
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/", tags=["Info"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Cloud Downloader API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "download": "/download",
            "download_and_extract": "/download-and-extract",
            "docs": "/docs",
        },
        "supported_providers": [
            "Google Drive",
            "Dropbox",
            "OneDrive/SharePoint",
            "GitHub",
            "Direct HTTP/HTTPS URLs",
        ],
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.

    Returns service status and version information.
    """
    return {"status": "healthy", "service": "cloud-downloader", "version": "1.0.0"}


@app.post("/download", response_model=DownloadResponse, tags=["Download"])
async def download_file(request: DownloadRequest):
    """
    Download a file from a cloud storage URL.

    Supports:
    - Google Drive (with virus scan bypass)
    - Dropbox
    - OneDrive/SharePoint
    - GitHub
    - Direct HTTP/HTTPS URLs

    Returns:
        File content as base64 encoded string along with metadata.
    """
    try:
        logger.info(f"Download request received for URL: {request.url}")

        # Create downloader with custom size limit
        downloader = CloudDownloader(max_size_mb=request.max_size_mb)

        # Download the file
        result = downloader.download_file(request.url)

        if result["success"]:
            # Encode content as base64 for JSON transport
            content_base64 = base64.b64encode(result["content"]).decode("utf-8")

            logger.info(
                f"Successfully downloaded {result['filename']} ({result['size']} bytes)"
            )

            return {
                "success": True,
                "filename": result["filename"],
                "size": result["size"],
                "content_type": result["content_type"],
                "provider": result["provider"],
                "content_base64": content_base64,
            }
        else:
            logger.error(f"Download failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(
                status_code=400, detail=result.get("error", "Download failed")
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/download-and-extract", tags=["Download"])
async def download_and_extract(request: DownloadAndExtractRequest):
    """
    Download a file and optionally extract text using OCR.

    This endpoint downloads the file and can extract text if it's a PDF or image.
    Note: Text extraction requires additional dependencies (PyMuPDF or similar).

    Returns:
        File content and extracted text (if requested).
    """
    try:
        logger.info(f"Download and extract request for URL: {request.url}")

        # Download the file
        downloader = CloudDownloader(max_size_mb=request.max_size_mb)
        result = downloader.download_file(request.url)

        if not result["success"]:
            raise HTTPException(
                status_code=400, detail=result.get("error", "Download failed")
            )

        # Encode content as base64
        content_base64 = base64.b64encode(result["content"]).decode("utf-8")

        response = {
            "success": True,
            "filename": result["filename"],
            "size": result["size"],
            "content_type": result["content_type"],
            "provider": result["provider"],
            "content_base64": content_base64,
        }

        # Extract text if requested
        if request.extract_text:
            try:
                extracted_text = await extract_text_from_content(
                    result["content"], result["content_type"]
                )
                response["extracted_text"] = extracted_text
                response["text_length"] = len(extracted_text)
                logger.info(f"Extracted {len(extracted_text)} characters of text")
            except Exception as e:
                logger.warning(f"Text extraction failed: {str(e)}")
                response["extraction_error"] = str(e)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/download-binary", tags=["Download"])
async def download_binary(request: DownloadRequest):
    """
    Download a file and return binary content directly.

    This endpoint is useful for large files where base64 encoding overhead
    should be avoided.
    """
    try:
        logger.info(f"Binary download request for URL: {request.url}")

        downloader = CloudDownloader(max_size_mb=request.max_size_mb)
        result = downloader.download_file(request.url)

        if result["success"]:
            from fastapi.responses import Response

            return Response(
                content=result["content"],
                media_type=result["content_type"],
                headers={
                    "Content-Disposition": f'attachment; filename="{result["filename"]}"',
                    "X-Provider": result["provider"],
                    "X-File-Size": str(result["size"]),
                },
            )
        else:
            raise HTTPException(
                status_code=400, detail=result.get("error", "Download failed")
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def extract_text_from_content(content: bytes, content_type: str) -> str:
    """
    Extract text from file content.

    This is a placeholder function. For production, you would:
    - Use PyMuPDF for PDFs
    - Use PIL + pytesseract for images
    - Use python-docx for Word documents

    Args:
        content: File content as bytes
        content_type: MIME type of the file

    Returns:
        Extracted text
    """
    # Try to import text extraction libraries
    extracted_text = ""

    try:
        if "pdf" in content_type.lower():
            # Try PyMuPDF (fitz)
            try:
                import fitz  # PyMuPDF

                pdf_document = fitz.open(stream=content, filetype="pdf")
                for page_num in range(len(pdf_document)):
                    page = pdf_document[page_num]
                    extracted_text += page.get_text()
                pdf_document.close()
                return extracted_text
            except ImportError:
                logger.warning(
                    "PyMuPDF not installed. Install with: pip install PyMuPDF"
                )
                return "Text extraction not available - PyMuPDF not installed"

        elif "image" in content_type.lower():
            # Try pytesseract for images
            try:
                import pytesseract
                from PIL import Image

                image = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(image)
                return extracted_text
            except ImportError:
                logger.warning("PIL or pytesseract not installed")
                return "Text extraction not available - PIL/pytesseract not installed"

        elif "word" in content_type.lower() or "document" in content_type.lower():
            # Try python-docx
            try:
                from docx import Document

                doc = Document(io.BytesIO(content))
                for paragraph in doc.paragraphs:
                    extracted_text += paragraph.text + "\n"
                return extracted_text
            except ImportError:
                logger.warning("python-docx not installed")
                return "Text extraction not available - python-docx not installed"

        return "Text extraction not supported for this file type"

    except Exception as e:
        logger.error(f"Text extraction error: {str(e)}")
        return f"Text extraction failed: {str(e)}"


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "detail": "Internal server error",
        },
    )


# Server configuration
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info(f"Starting Cloud Downloader API on {host}:{port}")

    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info",
    )
