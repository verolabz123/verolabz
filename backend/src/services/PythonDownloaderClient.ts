/**
 * Python Downloader Client
 *
 * Integration client for the Python cloud downloader service.
 * This service handles problematic cloud storage URLs (Google Drive, Dropbox, OneDrive)
 * that fail with direct HTTP requests.
 *
 * Usage:
 *   const client = new PythonDownloaderClient();
 *   const result = await client.downloadFile('https://drive.google.com/file/d/...');
 *
 *   if (result.success) {
 *     const buffer = result.buffer;
 *     // Use buffer with OCR service
 *   }
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  filename?: string;
  size?: number;
  contentType?: string;
  provider?: string;
  error?: string;
  extractedText?: string;
}

export interface PythonDownloaderConfig {
  baseUrl?: string;
  timeout?: number;
  maxSizeMb?: number;
}

export class PythonDownloaderClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private maxSizeMb: number;
  private enabled: boolean;

  constructor(config: PythonDownloaderConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.PYTHON_DOWNLOADER_URL || 'http://localhost:8000';
    this.maxSizeMb = config.maxSizeMb || 50;

    // Check if Python service is enabled
    this.enabled = process.env.ENABLE_PYTHON_DOWNLOADER !== 'false';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info(`Python Downloader Client initialized: ${this.baseUrl} (enabled: ${this.enabled})`);
  }

  /**
   * Check if the Python downloader service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      logger.warn('Python downloader service not available');
      return false;
    }
  }

  /**
   * Check if URL should use Python downloader
   * (cloud storage URLs that typically fail with direct requests)
   */
  shouldUsePythonDownloader(url: string): boolean {
    if (!this.enabled) {
      return false;
    }

    const urlLower = url.toLowerCase();

    return (
      urlLower.includes('drive.google.com') ||
      urlLower.includes('docs.google.com') ||
      urlLower.includes('dropbox.com') ||
      urlLower.includes('onedrive.live.com') ||
      urlLower.includes('sharepoint.com') ||
      urlLower.includes('1drv.ms')
    );
  }

  /**
   * Download file from URL using Python service
   */
  async downloadFile(url: string): Promise<DownloadResult> {
    try {
      logger.info(`Downloading via Python service: ${url}`);

      const response = await this.client.post('/download', {
        url,
        max_size_mb: this.maxSizeMb,
      });

      if (response.data.success) {
        // Decode base64 content to buffer
        const buffer = Buffer.from(response.data.content_base64, 'base64');

        logger.info(`Successfully downloaded ${response.data.filename} (${response.data.size} bytes) via Python service`);

        return {
          success: true,
          buffer,
          filename: response.data.filename,
          size: response.data.size,
          contentType: response.data.content_type,
          provider: response.data.provider,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Download failed',
        };
      }
    } catch (error: any) {
      logger.error(`Python downloader error: ${error.message}`);

      if (error.response?.data?.detail) {
        return {
          success: false,
          error: error.response.data.detail,
        };
      }

      return {
        success: false,
        error: error.message || 'Download failed',
      };
    }
  }

  /**
   * Download file and extract text in one call
   */
  async downloadAndExtractText(url: string): Promise<DownloadResult> {
    try {
      logger.info(`Downloading and extracting text via Python service: ${url}`);

      const response = await this.client.post('/download-and-extract', {
        url,
        max_size_mb: this.maxSizeMb,
        extract_text: true,
      });

      if (response.data.success) {
        const buffer = Buffer.from(response.data.content_base64, 'base64');

        logger.info(`Successfully downloaded and extracted text from ${response.data.filename}`);

        return {
          success: true,
          buffer,
          filename: response.data.filename,
          size: response.data.size,
          contentType: response.data.content_type,
          provider: response.data.provider,
          extractedText: response.data.extracted_text,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Download failed',
        };
      }
    } catch (error: any) {
      logger.error(`Python downloader error: ${error.message}`);

      if (error.response?.data?.detail) {
        return {
          success: false,
          error: error.response.data.detail,
        };
      }

      return {
        success: false,
        error: error.message || 'Download failed',
      };
    }
  }

  /**
   * Download file as binary stream (more efficient for large files)
   */
  async downloadBinary(url: string): Promise<DownloadResult> {
    try {
      logger.info(`Downloading binary via Python service: ${url}`);

      const response = await this.client.post('/download-binary',
        {
          url,
          max_size_mb: this.maxSizeMb,
        },
        {
          responseType: 'arraybuffer',
        }
      );

      const buffer = Buffer.from(response.data);
      const filename = response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'download';
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const provider = response.headers['x-provider'];

      logger.info(`Successfully downloaded ${filename} (${buffer.length} bytes) via Python service`);

      return {
        success: true,
        buffer,
        filename,
        size: buffer.length,
        contentType,
        provider,
      };
    } catch (error: any) {
      logger.error(`Python downloader binary error: ${error.message}`);

      return {
        success: false,
        error: error.message || 'Download failed',
      };
    }
  }

  /**
   * Smart download that tries Python service for cloud URLs, falls back to direct download
   */
  async smartDownload(url: string, fallbackFn?: (url: string) => Promise<Buffer>): Promise<DownloadResult> {
    // Check if we should use Python downloader
    const shouldUsePython = this.shouldUsePythonDownloader(url);

    if (shouldUsePython) {
      logger.info(`Using Python downloader for cloud URL: ${url}`);
      const result = await this.downloadFile(url);

      if (result.success) {
        return result;
      }

      // Python download failed, try fallback if provided
      logger.warn(`Python download failed, attempting fallback method`);
    }

    // Try fallback function if provided
    if (fallbackFn) {
      try {
        const buffer = await fallbackFn(url);
        return {
          success: true,
          buffer,
          filename: url.split('/').pop() || 'download',
          size: buffer.length,
          contentType: 'application/octet-stream',
        };
      } catch (error: any) {
        logger.error(`Fallback download failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: false,
      error: 'No fallback method provided and Python download failed',
    };
  }
}

// Singleton instance
let pythonDownloaderInstance: PythonDownloaderClient | null = null;

export function getPythonDownloaderClient(): PythonDownloaderClient {
  if (!pythonDownloaderInstance) {
    pythonDownloaderInstance = new PythonDownloaderClient();
  }
  return pythonDownloaderInstance;
}

export default PythonDownloaderClient;
