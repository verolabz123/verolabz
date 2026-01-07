"""
Cloud Downloader Service
Downloads resume files from Google Drive, Dropbox, OneDrive, and other cloud storage services.

This service handles:
- Google Drive public links (with virus scan bypass)
- Dropbox public links
- OneDrive/SharePoint public links
- Direct HTTP/HTTPS URLs
- GitHub raw links

Usage:
    from cloud_downloader import CloudDownloader

    downloader = CloudDownloader()
    result = downloader.download_file("https://drive.google.com/file/d/FILE_ID/view")

    if result['success']:
        with open('resume.pdf', 'wb') as f:
            f.write(result['content'])
"""

import logging
import re
import time
from typing import Dict, Optional, Tuple
from urllib.parse import parse_qs, unquote, urlparse

import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class CloudDownloader:
    """
    Universal cloud storage downloader supporting multiple providers.
    """

    def __init__(self, timeout: int = 30, max_size_mb: int = 50):
        """
        Initialize the downloader.

        Args:
            timeout: Request timeout in seconds
            max_size_mb: Maximum file size to download in MB
        """
        self.timeout = timeout
        self.max_size_bytes = max_size_mb * 1024 * 1024

        # Browser-like headers to avoid blocks
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def download_file(self, url: str) -> Dict:
        """
        Download file from any supported cloud storage URL.

        Args:
            url: Public URL to the file

        Returns:
            Dict with:
                - success (bool): Whether download succeeded
                - content (bytes): File content if successful
                - filename (str): Suggested filename
                - size (int): File size in bytes
                - content_type (str): MIME type
                - error (str): Error message if failed
                - provider (str): Detected provider
        """
        try:
            logger.info(f"Attempting to download from: {url}")

            # Detect provider and route to appropriate handler
            provider = self._detect_provider(url)
            logger.info(f"Detected provider: {provider}")

            if provider == "google_drive":
                return self._download_google_drive(url)
            elif provider == "dropbox":
                return self._download_dropbox(url)
            elif provider == "onedrive":
                return self._download_onedrive(url)
            elif provider == "github":
                return self._download_github(url)
            else:
                return self._download_direct(url)

        except Exception as e:
            logger.error(f"Download failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "provider": provider if "provider" in locals() else "unknown",
            }

    def _detect_provider(self, url: str) -> str:
        """Detect cloud storage provider from URL."""
        url_lower = url.lower()

        if "drive.google.com" in url_lower or "docs.google.com" in url_lower:
            return "google_drive"
        elif "dropbox.com" in url_lower:
            return "dropbox"
        elif (
            "onedrive.live.com" in url_lower
            or "sharepoint.com" in url_lower
            or "1drv.ms" in url_lower
        ):
            return "onedrive"
        elif "github.com" in url_lower or "githubusercontent.com" in url_lower:
            return "github"
        else:
            return "direct"

    def _download_google_drive(self, url: str) -> Dict:
        """
        Download from Google Drive with virus scan bypass.

        Handles:
        - https://drive.google.com/file/d/FILE_ID/view
        - https://drive.google.com/open?id=FILE_ID
        - https://drive.google.com/uc?id=FILE_ID
        """
        try:
            # Extract file ID
            file_id = self._extract_google_drive_id(url)
            if not file_id:
                return {
                    "success": False,
                    "error": "Could not extract Google Drive file ID",
                    "provider": "google_drive",
                }

            logger.info(f"Google Drive file ID: {file_id}")

            # Try direct download first
            download_url = f"https://drive.google.com/uc?id={file_id}&export=download"

            response = self.session.get(download_url, stream=True, timeout=self.timeout)

            # Check for virus scan warning (large files)
            if (
                "virus-scan-warning" in response.text
                or "download_warning" in response.text
            ):
                logger.info("Detected virus scan warning, bypassing...")
                return self._bypass_google_virus_scan(file_id, response)

            # Check if it's an HTML page (not a direct download)
            content_type = response.headers.get("Content-Type", "")
            if (
                "text/html" in content_type
                and response.content[:100].lower().find(b"<!doctype") != -1
            ):
                logger.info("Got HTML page, trying alternative method...")
                return self._bypass_google_virus_scan(file_id, response)

            # Successful direct download
            content = self._download_content(response)
            filename = self._extract_filename(response, f"google_drive_{file_id}.pdf")

            return {
                "success": True,
                "content": content,
                "filename": filename,
                "size": len(content),
                "content_type": content_type,
                "provider": "google_drive",
            }

        except Exception as e:
            logger.error(f"Google Drive download failed: {str(e)}")
            return {
                "success": False,
                "error": f"Google Drive download failed: {str(e)}",
                "provider": "google_drive",
            }

    def _extract_google_drive_id(self, url: str) -> Optional[str]:
        """Extract file ID from various Google Drive URL formats."""
        patterns = [
            r"/file/d/([a-zA-Z0-9_-]+)",
            r"[?&]id=([a-zA-Z0-9_-]+)",
            r"/open\?id=([a-zA-Z0-9_-]+)",
            r"/uc\?id=([a-zA-Z0-9_-]+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        return None

    def _bypass_google_virus_scan(
        self, file_id: str, initial_response: requests.Response
    ) -> Dict:
        """
        Bypass Google Drive virus scan warning for large files.
        """
        try:
            # Extract confirmation token from the warning page
            token = None
            for line in initial_response.text.split("\n"):
                if "confirm=" in line or "download_warning" in line:
                    match = re.search(r"confirm=([a-zA-Z0-9_-]+)", line)
                    if match:
                        token = match.group(1)
                        break

            if not token:
                # Try alternative token extraction
                match = re.search(r'"downloadUrl":"([^"]+)"', initial_response.text)
                if match:
                    download_url = (
                        match.group(1).replace("\\u003d", "=").replace("\\u0026", "&")
                    )
                    response = self.session.get(
                        download_url, stream=True, timeout=self.timeout
                    )
                else:
                    # Use UUID approach
                    token = "t"  # Generic token that sometimes works

            # Download with confirmation token
            download_url = f"https://drive.google.com/uc?id={file_id}&confirm={token}&export=download"
            logger.info(f"Downloading with token: {download_url}")

            response = self.session.get(download_url, stream=True, timeout=self.timeout)

            content = self._download_content(response)
            filename = self._extract_filename(response, f"google_drive_{file_id}.pdf")

            return {
                "success": True,
                "content": content,
                "filename": filename,
                "size": len(content),
                "content_type": response.headers.get(
                    "Content-Type", "application/octet-stream"
                ),
                "provider": "google_drive",
            }

        except Exception as e:
            logger.error(f"Virus scan bypass failed: {str(e)}")
            return {
                "success": False,
                "error": f"Could not bypass Google Drive virus scan: {str(e)}",
                "provider": "google_drive",
            }

    def _download_dropbox(self, url: str) -> Dict:
        """
        Download from Dropbox public link.

        Converts:
        - https://www.dropbox.com/s/FILE_ID/resume.pdf?dl=0
        To:
        - https://www.dropbox.com/s/FILE_ID/resume.pdf?dl=1
        """
        try:
            # Convert to direct download URL
            if "?dl=0" in url:
                url = url.replace("?dl=0", "?dl=1")
            elif "?dl=" not in url:
                url = url + ("&" if "?" in url else "?") + "dl=1"

            # Also try raw parameter
            if "dl=1" not in url:
                url = url.replace("?dl=0", "?raw=1")

            logger.info(f"Dropbox direct URL: {url}")

            response = self.session.get(url, stream=True, timeout=self.timeout)
            response.raise_for_status()

            content = self._download_content(response)
            filename = self._extract_filename(response, "dropbox_file.pdf")

            return {
                "success": True,
                "content": content,
                "filename": filename,
                "size": len(content),
                "content_type": response.headers.get(
                    "Content-Type", "application/octet-stream"
                ),
                "provider": "dropbox",
            }

        except Exception as e:
            logger.error(f"Dropbox download failed: {str(e)}")
            return {
                "success": False,
                "error": f"Dropbox download failed: {str(e)}",
                "provider": "dropbox",
            }

    def _download_onedrive(self, url: str) -> Dict:
        """
        Download from OneDrive/SharePoint public link.
        """
        try:
            # OneDrive download URL format
            if "download=1" not in url:
                url = url + ("&" if "?" in url else "?") + "download=1"

            logger.info(f"OneDrive URL: {url}")

            response = self.session.get(
                url, stream=True, timeout=self.timeout, allow_redirects=True
            )
            response.raise_for_status()

            content = self._download_content(response)
            filename = self._extract_filename(response, "onedrive_file.pdf")

            return {
                "success": True,
                "content": content,
                "filename": filename,
                "size": len(content),
                "content_type": response.headers.get(
                    "Content-Type", "application/octet-stream"
                ),
                "provider": "onedrive",
            }

        except Exception as e:
            logger.error(f"OneDrive download failed: {str(e)}")
            return {
                "success": False,
                "error": f"OneDrive download failed: {str(e)}",
                "provider": "onedrive",
            }

    def _download_github(self, url: str) -> Dict:
        """
        Download from GitHub (convert to raw if needed).
        """
        try:
            # Convert GitHub URLs to raw format
            if "github.com" in url and "raw.githubusercontent.com" not in url:
                url = url.replace("github.com", "raw.githubusercontent.com")
                url = url.replace("/blob/", "/")

            logger.info(f"GitHub raw URL: {url}")

            response = self.session.get(url, stream=True, timeout=self.timeout)
            response.raise_for_status()

            content = self._download_content(response)
            filename = self._extract_filename(response, url.split("/")[-1])

            return {
                "success": True,
                "content": content,
                "filename": filename,
                "size": len(content),
                "content_type": response.headers.get(
                    "Content-Type", "application/octet-stream"
                ),
                "provider": "github",
            }

        except Exception as e:
            logger.error(f"GitHub download failed: {str(e)}")
            return {
                "success": False,
                "error": f"GitHub download failed: {str(e)}",
                "provider": "github",
            }

    def _download_direct(self, url: str) -> Dict:
        """
        Download from direct HTTP/HTTPS URL.
        """
        try:
            # First, check file size with HEAD request
            try:
                head_response = self.session.head(url, timeout=10, allow_redirects=True)
                content_length = int(head_response.headers.get("Content-Length", 0))

                if content_length > self.max_size_bytes:
                    return {
                        "success": False,
                        "error": f"File too large: {content_length / 1024 / 1024:.2f}MB (max: {self.max_size_bytes / 1024 / 1024}MB)",
                        "provider": "direct",
                    }
            except:
                logger.warning("HEAD request failed, proceeding with GET")

            # Download the file
            response = self.session.get(url, stream=True, timeout=self.timeout)
            response.raise_for_status()

            content = self._download_content(response)
            filename = self._extract_filename(
                response, url.split("/")[-1].split("?")[0]
            )

            return {
                "success": True,
                "content": content,
                "filename": filename,
                "size": len(content),
                "content_type": response.headers.get(
                    "Content-Type", "application/octet-stream"
                ),
                "provider": "direct",
            }

        except Exception as e:
            logger.error(f"Direct download failed: {str(e)}")
            return {
                "success": False,
                "error": f"Direct download failed: {str(e)}",
                "provider": "direct",
            }

    def _download_content(self, response: requests.Response) -> bytes:
        """
        Download content in chunks with size limit.
        """
        content = b""
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                content += chunk
                if len(content) > self.max_size_bytes:
                    raise Exception(
                        f"File exceeds maximum size of {self.max_size_bytes / 1024 / 1024}MB"
                    )

        return content

    def _extract_filename(self, response: requests.Response, default: str) -> str:
        """
        Extract filename from Content-Disposition header or URL.
        """
        # Try Content-Disposition header
        content_disposition = response.headers.get("Content-Disposition", "")
        if content_disposition:
            match = re.search(
                r'filename[^;=\n]*=[\'"]?([^\'";\n]+)', content_disposition
            )
            if match:
                filename = unquote(match.group(1))
                return filename

        # Try URL path
        parsed_url = urlparse(response.url)
        path_parts = parsed_url.path.split("/")
        if path_parts[-1]:
            filename = unquote(path_parts[-1])
            if "." in filename:
                return filename

        # Use default
        return default


def download_from_url(url: str, output_path: Optional[str] = None) -> Dict:
    """
    Convenience function to download a file from a URL.

    Args:
        url: URL to download from
        output_path: Optional path to save file

    Returns:
        Result dictionary with success status and file info
    """
    downloader = CloudDownloader()
    result = downloader.download_file(url)

    if result["success"] and output_path:
        with open(output_path, "wb") as f:
            f.write(result["content"])
        logger.info(f"File saved to: {output_path}")
        result["saved_path"] = output_path

    return result


# Example usage
if __name__ == "__main__":
    # Test URLs (replace with actual URLs)
    test_urls = [
        "https://drive.google.com/file/d/1abc123/view",  # Google Drive
        "https://www.dropbox.com/s/abc123/resume.pdf?dl=0",  # Dropbox
        "https://example.com/resume.pdf",  # Direct link
    ]

    downloader = CloudDownloader()

    for url in test_urls:
        print(f"\n{'=' * 60}")
        print(f"Testing: {url}")
        print("=" * 60)

        result = downloader.download_file(url)

        if result["success"]:
            print(f"✓ Success!")
            print(f"  Provider: {result['provider']}")
            print(f"  Filename: {result['filename']}")
            print(f"  Size: {result['size'] / 1024:.2f} KB")
            print(f"  Content-Type: {result['content_type']}")
        else:
            print(f"✗ Failed: {result['error']}")
