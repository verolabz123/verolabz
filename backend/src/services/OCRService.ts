import Tesseract from "tesseract.js";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import { logger } from "../utils/logger.js";

interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}

interface PDFInfo {
  text: string;
  numPages: number;
  metadata?: any;
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  /**
   * Initialize Tesseract worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info("Initializing OCR service...");
      this.worker = await createWorker("eng");
      this.isInitialized = true;
      logger.info("OCR service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize OCR service:", error);
      throw error;
    }
  }

  /**
   * Terminate OCR worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      logger.info("OCR service terminated");
    }
  }

  /**
   * Extract text from PDF (handles both text and scanned PDFs)
   */
  async extractFromPDF(buffer: Buffer): Promise<PDFInfo> {
    const startTime = Date.now();

    try {
      logger.info("Extracting text from PDF...");

      // First, try to extract text directly from PDF
      // Use dynamic import from lib path to avoid test file initialization issue
      const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const data = await pdfParse(buffer);

      if (data.text && data.text.trim().length > 100) {
        // PDF has extractable text
        logger.info(
          `Successfully extracted text from PDF (${data.numpages} pages, ${data.text.length} chars)`,
        );
        return {
          text: data.text,
          numPages: data.numpages,
          metadata: data.info,
        };
      }

      // If text extraction failed or produced minimal text, it might be a scanned PDF
      logger.warn(
        "PDF appears to be scanned. OCR is required but not implemented for PDFs yet.",
      );

      // For now, return whatever text we got
      return {
        text: data.text || "",
        numPages: data.numpages,
        metadata: data.info,
      };
    } catch (error: any) {
      logger.error("PDF extraction failed:", error.message);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    } finally {
      const processingTime = Date.now() - startTime;
      logger.info(`PDF processing completed in ${processingTime}ms`);
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractFromImage(buffer: Buffer): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.worker) {
        throw new Error("OCR worker not initialized");
      }

      logger.info("Processing image with OCR...");

      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(buffer);

      // Perform OCR
      const result = await this.worker.recognize(processedImage);

      const processingTime = Date.now() - startTime;

      logger.info(
        `OCR completed in ${processingTime}ms with confidence ${result.data.confidence}%`,
      );

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        language: "eng",
        processingTime,
      };
    } catch (error: any) {
      logger.error("OCR failed:", error.message);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      // Convert to grayscale, increase contrast, and resize if needed
      return await sharp(buffer).grayscale().normalize().sharpen().toBuffer();
    } catch (error: any) {
      logger.warn("Image preprocessing failed, using original:", error.message);
      return buffer;
    }
  }

  /**
   * Detect if buffer contains a PDF
   */
  static isPDF(buffer: Buffer): boolean {
    // PDFs start with %PDF
    return buffer.length > 4 && buffer.toString("utf8", 0, 4) === "%PDF";
  }

  /**
   * Detect if buffer contains an image
   */
  static isImage(buffer: Buffer): boolean {
    // Check for common image signatures
    if (buffer.length < 4) return false;

    const header = buffer.toString("hex", 0, 4);

    // PNG: 89 50 4E 47
    if (header === "89504e47") return true;

    // JPEG: FF D8 FF
    if (buffer.toString("hex", 0, 3) === "ffd8ff") return true;

    // GIF: 47 49 46 38
    if (header.substring(0, 6) === "474946") return true;

    // BMP: 42 4D
    if (header.substring(0, 4) === "424d") return true;

    return false;
  }

  /**
   * Process any document type (PDF or image)
   */
  async processDocument(buffer: Buffer, filename?: string): Promise<string> {
    logger.info(`Processing document: ${filename || "unknown"}`);

    // Detect document type
    if (OCRService.isPDF(buffer)) {
      logger.info("Detected PDF document");
      const result = await this.extractFromPDF(buffer);
      return result.text;
    } else if (OCRService.isImage(buffer)) {
      logger.info("Detected image document");
      const result = await this.extractFromImage(buffer);
      return result.text;
    } else {
      // Try as text
      logger.info("Unknown format, attempting to read as text");
      return buffer.toString("utf8");
    }
  }

  /**
   * Clean extracted text
   */
  static cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove special characters that don't add meaning
        .replace(/[^\w\s@.,;:()\-\/]/g, "")
        // Normalize line breaks
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Remove multiple consecutive line breaks
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }

  /**
   * Validate extracted text quality
   */
  static validateText(text: string): { valid: boolean; reason?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, reason: "No text extracted" };
    }

    if (text.length < 50) {
      return {
        valid: false,
        reason: "Text too short (less than 50 characters)",
      };
    }

    // Check if text is mostly garbage characters
    const printableChars = (text.match(/[\w\s]/g) || []).length;
    const ratio = printableChars / text.length;

    if (ratio < 0.7) {
      return {
        valid: false,
        reason: "Text appears to be corrupted or unreadable",
      };
    }

    return { valid: true };
  }
}

// Singleton instance
let ocrServiceInstance: OCRService | null = null;

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService();
  }
  return ocrServiceInstance;
}

export default OCRService;
