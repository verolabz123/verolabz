import { Router, Request, Response } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getOCRService } from "../services/OCRService.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept PDFs and common image formats
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported: ${file.mimetype}`) as any);
    }
  },
});

/**
 * POST /api/v1/ocr/extract
 * Upload and extract text from resume document (PDF or Image)
 *
 * @body file - The resume file (PDF or image)
 * @returns {object} Extracted text and metadata
 */
router.post(
  "/extract",
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a file with the key "file".',
      });
    }

    const startTime = Date.now();
    const { originalname, mimetype, size, buffer } = req.file;

    logger.info(
      `Processing OCR request for file: ${originalname} (${mimetype}, ${(size / 1024).toFixed(2)}KB)`,
    );

    try {
      const ocrService = getOCRService();

      // Initialize OCR service if needed
      await ocrService.initialize();

      // Process the document
      const extractedText = await ocrService.processDocument(
        buffer,
        originalname,
      );

      // Clean the extracted text
      const cleanedText = (ocrService.constructor as any).cleanText(
        extractedText,
      );

      // Validate text quality
      const validation = (ocrService.constructor as any).validateText(
        cleanedText,
      );

      const processingTime = Date.now() - startTime;

      if (!validation.valid) {
        logger.warn(`Text validation failed: ${validation.reason}`);
        return res.status(422).json({
          success: false,
          error: "Text extraction quality check failed",
          details: validation.reason,
          extractedText: cleanedText,
          metadata: {
            filename: originalname,
            mimetype,
            size,
            processingTime,
          },
        });
      }

      logger.info(
        `Successfully extracted ${cleanedText.length} characters in ${processingTime}ms`,
      );

      res.status(200).json({
        success: true,
        data: {
          text: cleanedText,
          rawText: extractedText,
          metadata: {
            filename: originalname,
            mimetype,
            size,
            characterCount: cleanedText.length,
            wordCount: cleanedText
              .split(/\s+/)
              .filter((w: string) => w.length > 0).length,
            processingTime,
            validation: validation,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error(`OCR extraction failed for ${originalname}:`, error);

      res.status(500).json({
        success: false,
        error: "Failed to extract text from document",
        details: error.message,
        metadata: {
          filename: originalname,
          mimetype,
          size,
        },
      });
    }
  }),
);

/**
 * POST /api/v1/ocr/extract-and-parse
 * Upload, extract text, and parse resume in one request
 *
 * @body file - The resume file (PDF or image)
 * @body candidateName (optional) - Candidate's name
 * @body candidateEmail (optional) - Candidate's email
 * @body candidatePhone (optional) - Candidate's phone
 * @returns {object} Extracted text and parsed resume data
 */
router.post(
  "/extract-and-parse",
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a file with the key "file".',
      });
    }

    const startTime = Date.now();
    const { originalname, mimetype, size, buffer } = req.file;
    const { candidateName, candidateEmail, candidatePhone } = req.body;

    logger.info(`Processing OCR + Parse request for file: ${originalname}`);

    try {
      const ocrService = getOCRService();

      // Initialize OCR service if needed
      await ocrService.initialize();

      // Process the document
      // Process the document
      const extractedText = await ocrService.processDocument(
        buffer,
        originalname,
      );

      // Clean the extracted text
      const cleanedText = (ocrService.constructor as any).cleanText(
        extractedText,
      );

      // Validate text quality
      const validation = (ocrService.constructor as any).validateText(
        cleanedText,
      );

      if (!validation.valid) {
        return res.status(422).json({
          success: false,
          error: "Text extraction quality check failed",
          details: validation.reason,
        });
      }

      // Import EvaluationService to parse the resume
      const { default: EvaluationService } =
        await import("../services/EvaluationService.js");
      const evalService = new EvaluationService();

      // Parse the resume
      const parsedResume = await evalService.parseResumeOnly(cleanedText, {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
      });

      const processingTime = Date.now() - startTime;

      logger.info(
        `Successfully extracted and parsed resume in ${processingTime}ms`,
      );

      res.status(200).json({
        success: true,
        data: {
          extractedText: cleanedText,
          parsedResume,
          metadata: {
            filename: originalname,
            mimetype,
            size,
            characterCount: cleanedText.length,
            processingTime,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error(`OCR + Parse failed for ${originalname}:`, error);

      res.status(500).json({
        success: false,
        error: "Failed to extract and parse resume",
        details: error.message,
      });
    }
  }),
);

/**
 * GET /api/v1/ocr/health
 * Check OCR service health and capabilities
 */
router.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const ocrService = getOCRService();
      await ocrService.initialize();

      res.status(200).json({
        success: true,
        data: {
          status: "operational",
          capabilities: {
            pdf: true,
            images: true,
            supportedFormats: ["PDF", "JPEG", "PNG", "GIF", "BMP", "TIFF"],
            ocrEngine: "Tesseract.js",
            maxFileSize: "10MB",
          },
          message: "OCR service is ready to process documents",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        error: "OCR service unavailable",
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

/**
 * POST /api/v1/ocr/validate
 * Validate if a file can be processed
 */
router.post(
  "/validate",
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    const isPDF = buffer.length > 4 && buffer.toString("utf8", 0, 4) === "%PDF";
    const isImage = (() => {
      if (buffer.length < 4) return false;
      const header = buffer.toString("hex", 0, 4);
      return (
        header === "89504e47" || // PNG
        buffer.toString("hex", 0, 3) === "ffd8ff" || // JPEG
        header.substring(0, 6) === "474946" || // GIF
        header.substring(0, 4) === "424d" // BMP
      );
    })();

    const canProcess = isPDF || isImage;

    res.status(200).json({
      success: true,
      data: {
        canProcess,
        fileInfo: {
          filename: originalname,
          mimetype,
          size,
          sizeKB: (size / 1024).toFixed(2),
          sizeMB: (size / (1024 * 1024)).toFixed(2),
        },
        detection: {
          isPDF,
          isImage,
          detectedType: isPDF ? "PDF" : isImage ? "Image" : "Unknown",
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
