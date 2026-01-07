import fs from 'fs';
import { logger } from './logger.js';

/**
 * Safe PDF parser that handles the pdf-parse package initialization issue
 */
export async function parsePDF(filePath: string): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid initialization issues
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    return data.text;
  } catch (error: any) {
    logger.error('Error parsing PDF:', error);
    
    // Fallback: return empty string if parsing fails
    logger.warn('PDF parsing failed, returning empty string');
    return '';
  }
}

/**
 * Parse resume file based on MIME type
 */
export async function parseResumeFile(filePath: string, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      return await parsePDF(filePath);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (mimetype === 'application/msword' || mimetype === 'text/plain') {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  } catch (error) {
    logger.error('Error parsing resume file:', error);
    throw new Error('Failed to parse resume file');
  }
}

export default { parsePDF, parseResumeFile };
