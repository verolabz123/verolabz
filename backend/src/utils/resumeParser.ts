import fs from "fs";
import { logger } from "./logger.js";

/**
 * Safe PDF parser that avoids pdf-parse initialization issues
 */
async function parsePDF(filePath: string): Promise<string> {
  try {
    // Use dynamic import from lib path to avoid test file initialization issue
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  } catch (error: any) {
    logger.error("PDF parsing error:", error.message);
    // Return placeholder text instead of failing
    return "[PDF content - parsing temporarily disabled. Please use TXT or DOCX format for full text extraction]";
  }
}

/**
 * Parse PDF from buffer (for downloaded resumes)
 */
export async function parseResumePDF(buffer: Buffer): Promise<string> {
  try {
    // Ensure buffer is actually a Buffer
    if (!Buffer.isBuffer(buffer)) {
      logger.error("Invalid buffer passed to parseResumePDF");
      throw new Error("Invalid buffer type");
    }

    if (buffer.length === 0) {
      logger.error("Empty buffer passed to parseResumePDF");
      throw new Error("Empty buffer");
    }

    logger.info(`Parsing PDF buffer of size: ${buffer.length} bytes`);

    // Verify it's actually a PDF by checking magic bytes
    const header = buffer.toString("utf8", 0, 4);
    if (!header.startsWith("%PDF")) {
      logger.error(`Buffer does not appear to be a PDF. Header: ${header}`);
      throw new Error("Buffer is not a valid PDF");
    }

    // Use dynamic import from lib path to avoid test file initialization issue
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = pdfParseModule.default || pdfParseModule;

    // Create a clean copy of the buffer to avoid any reference issues
    const cleanBuffer = Buffer.from(buffer);

    // Pass buffer directly to pdf-parse with minimal options
    const data = await pdfParse(cleanBuffer);

    const text = data.text || "";
    logger.info(
      `Successfully extracted ${text.length} characters from PDF (${data.numpages} pages)`,
    );

    if (text.length < 10) {
      logger.warn(
        "PDF parsed but contains very little text. May be scanned/image-based.",
      );
    }

    return text;
  } catch (error: any) {
    logger.error("PDF buffer parsing error:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
    });
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse DOCX files
 */
async function parseDOCX(filePath: string): Promise<string> {
  try {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } catch (error: any) {
    logger.error("DOCX parsing error:", error.message);
    return "[DOCX content - parsing failed]";
  }
}

/**
 * Parse text files
 */
function parseTXT(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error: any) {
    logger.error("TXT parsing error:", error.message);
    return "";
  }
}

/**
 * Main function to parse resume files based on MIME type
 */
export async function parseResumeFile(
  filePath: string,
  mimetype: string,
): Promise<string> {
  logger.info(`Parsing file: ${filePath} (${mimetype})`);

  try {
    switch (mimetype) {
      case "application/pdf":
        return await parsePDF(filePath);

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await parseDOCX(filePath);

      case "application/msword":
      case "text/plain":
        return parseTXT(filePath);

      default:
        logger.warn(`Unsupported file type: ${mimetype}`);
        return "[Unsupported file format]";
    }
  } catch (error: any) {
    logger.error("Error parsing resume file:", error);
    return "[Error parsing resume file]";
  }
}

export default parseResumeFile;
