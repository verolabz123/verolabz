/**
 * External OCR Service Integration
 *
 * This file provides template implementations for integrating external OCR services
 * like Google Cloud Vision, AWS Textract, Azure Form Recognizer, etc.
 *
 * Uncomment and configure the service you want to use.
 */

import { logger } from '../utils/logger.js';
import axios from 'axios';

// ============================================================================
// BASE INTERFACE
// ============================================================================

export interface ExternalOCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  provider: string;
}

export interface ExternalOCRService {
  extractText(buffer: Buffer, filename?: string): Promise<ExternalOCRResult>;
  initialize?(): Promise<void>;
  terminate?(): Promise<void>;
}

// ============================================================================
// GOOGLE CLOUD VISION API
// ============================================================================

/**
 * Google Cloud Vision OCR Service
 *
 * Setup:
 * 1. Install: npm install @google-cloud/vision
 * 2. Create service account at: https://console.cloud.google.com/iam-admin/serviceaccounts
 * 3. Download JSON key file
 * 4. Set GOOGLE_APPLICATION_CREDENTIALS env var or pass keyFilename
 *
 * Environment Variables:
 * - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
 * OR
 * - GOOGLE_CLOUD_PROJECT_ID=your-project-id
 * - GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
 * - GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
 */
export class GoogleVisionOCR implements ExternalOCRService {
  private client: any; // vision.ImageAnnotatorClient
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Uncomment to use Google Vision
      /*
      const vision = await import('@google-cloud/vision');

      // Option 1: Use service account file
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new vision.ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
      }
      // Option 2: Use credentials from environment
      else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
        this.client = new vision.ImageAnnotatorClient({
          credentials: {
            client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        });
      }
      else {
        throw new Error('Google Cloud credentials not configured');
      }

      this.isInitialized = true;
      logger.info('Google Cloud Vision OCR initialized');
      */

      throw new Error('Google Cloud Vision not configured. Uncomment code and install @google-cloud/vision');
    } catch (error: any) {
      logger.error('Failed to initialize Google Cloud Vision:', error);
      throw error;
    }
  }

  async extractText(buffer: Buffer, filename?: string): Promise<ExternalOCRResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Uncomment to use Google Vision
      /*
      const [result] = await this.client.documentTextDetection({
        image: { content: buffer }
      });

      const fullText = result.fullTextAnnotation?.text || '';
      const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0;

      logger.info(`Google Vision extracted ${fullText.length} characters with ${(confidence * 100).toFixed(2)}% confidence`);

      return {
        text: fullText,
        confidence: confidence * 100,
        processingTime: Date.now() - startTime,
        provider: 'google-vision',
      };
      */

      throw new Error('Google Cloud Vision not implemented');
    } catch (error: any) {
      logger.error('Google Vision OCR failed:', error);
      throw new Error(`Google Vision OCR failed: ${error.message}`);
    }
  }
}

// ============================================================================
// AWS TEXTRACT
// ============================================================================

/**
 * AWS Textract OCR Service
 *
 * Setup:
 * 1. Install: npm install @aws-sdk/client-textract
 * 2. Configure AWS credentials
 *
 * Environment Variables:
 * - AWS_REGION=us-east-1
 * - AWS_ACCESS_KEY_ID=your-access-key
 * - AWS_SECRET_ACCESS_KEY=your-secret-key
 */
export class AWSTextractOCR implements ExternalOCRService {
  private client: any; // TextractClient
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Uncomment to use AWS Textract
      /*
      const { TextractClient } = await import('@aws-sdk/client-textract');

      this.client = new TextractClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      this.isInitialized = true;
      logger.info('AWS Textract OCR initialized');
      */

      throw new Error('AWS Textract not configured. Uncomment code and install @aws-sdk/client-textract');
    } catch (error: any) {
      logger.error('Failed to initialize AWS Textract:', error);
      throw error;
    }
  }

  async extractText(buffer: Buffer, filename?: string): Promise<ExternalOCRResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Uncomment to use AWS Textract
      /*
      const { DetectDocumentTextCommand } = await import('@aws-sdk/client-textract');

      const command = new DetectDocumentTextCommand({
        Document: { Bytes: buffer }
      });

      const response = await this.client.send(command);

      // Extract text from LINE blocks
      const text = response.Blocks
        ?.filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n') || '';

      // Calculate average confidence
      const confidences = response.Blocks
        ?.filter(block => block.Confidence)
        .map(block => block.Confidence || 0) || [0];

      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

      logger.info(`AWS Textract extracted ${text.length} characters with ${avgConfidence.toFixed(2)}% confidence`);

      return {
        text,
        confidence: avgConfidence,
        processingTime: Date.now() - startTime,
        provider: 'aws-textract',
      };
      */

      throw new Error('AWS Textract not implemented');
    } catch (error: any) {
      logger.error('AWS Textract OCR failed:', error);
      throw new Error(`AWS Textract OCR failed: ${error.message}`);
    }
  }
}

// ============================================================================
// AZURE FORM RECOGNIZER
// ============================================================================

/**
 * Azure Form Recognizer OCR Service
 *
 * Setup:
 * 1. Install: npm install @azure/ai-form-recognizer
 * 2. Create Form Recognizer resource in Azure Portal
 *
 * Environment Variables:
 * - AZURE_FORM_RECOGNIZER_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
 * - AZURE_FORM_RECOGNIZER_KEY=your-api-key
 */
export class AzureFormRecognizerOCR implements ExternalOCRService {
  private client: any; // DocumentAnalysisClient
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Uncomment to use Azure Form Recognizer
      /*
      const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');

      const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
      const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY;

      if (!endpoint || !apiKey) {
        throw new Error('Azure Form Recognizer credentials not configured');
      }

      this.client = new DocumentAnalysisClient(
        endpoint,
        new AzureKeyCredential(apiKey)
      );

      this.isInitialized = true;
      logger.info('Azure Form Recognizer OCR initialized');
      */

      throw new Error('Azure Form Recognizer not configured. Uncomment code and install @azure/ai-form-recognizer');
    } catch (error: any) {
      logger.error('Failed to initialize Azure Form Recognizer:', error);
      throw error;
    }
  }

  async extractText(buffer: Buffer, filename?: string): Promise<ExternalOCRResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Uncomment to use Azure Form Recognizer
      /*
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-document',
        buffer
      );

      const result = await poller.pollUntilDone();

      const text = result.content || '';

      // Calculate average confidence from pages
      let totalConfidence = 0;
      let wordCount = 0;

      result.pages?.forEach(page => {
        page.words?.forEach(word => {
          totalConfidence += word.confidence || 0;
          wordCount++;
        });
      });

      const avgConfidence = wordCount > 0 ? (totalConfidence / wordCount) * 100 : 0;

      logger.info(`Azure Form Recognizer extracted ${text.length} characters with ${avgConfidence.toFixed(2)}% confidence`);

      return {
        text,
        confidence: avgConfidence,
        processingTime: Date.now() - startTime,
        provider: 'azure-form-recognizer',
      };
      */

      throw new Error('Azure Form Recognizer not implemented');
    } catch (error: any) {
      logger.error('Azure Form Recognizer OCR failed:', error);
      throw new Error(`Azure Form Recognizer OCR failed: ${error.message}`);
    }
  }
}

// ============================================================================
// OCR.SPACE API (Free tier available)
// ============================================================================

/**
 * OCR.space OCR Service
 *
 * Setup:
 * 1. Sign up at: https://ocr.space/ocrapi
 * 2. Get free API key (25,000 requests/month)
 *
 * Environment Variables:
 * - OCR_SPACE_API_KEY=your-api-key
 */
export class OCRSpaceService implements ExternalOCRService {
  private apiKey: string;
  private apiUrl = 'https://api.ocr.space/parse/image';

  constructor() {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new Error('OCR_SPACE_API_KEY environment variable not set');
    }
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    // No initialization needed for REST API
    logger.info('OCR.space service ready');
  }

  async extractText(buffer: Buffer, filename?: string): Promise<ExternalOCRResult> {
    const startTime = Date.now();

    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();

      formData.append('file', buffer, {
        filename: filename || 'document.pdf',
        contentType: filename?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      });
      formData.append('apikey', this.apiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');

      const response = await axios.post(this.apiUrl, formData, {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 second timeout
      });

      if (response.data.IsErroredOnProcessing) {
        throw new Error(response.data.ErrorMessage?.[0] || 'OCR processing failed');
      }

      const text = response.data.ParsedResults
        ?.map((result: any) => result.ParsedText)
        .join('\n') || '';

      // OCR.space doesn't provide confidence, estimate based on text quality
      const confidence = text.length > 50 ? 85 : 70;

      logger.info(`OCR.space extracted ${text.length} characters`);

      return {
        text,
        confidence,
        processingTime: Date.now() - startTime,
        provider: 'ocr-space',
      };
    } catch (error: any) {
      logger.error('OCR.space API failed:', error);
      throw new Error(`OCR.space API failed: ${error.message}`);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Factory function to create the appropriate OCR service based on configuration
 *
 * Environment Variables:
 * - EXTERNAL_OCR_PROVIDER=google|aws|azure|ocr-space
 */
export function createExternalOCRService(provider?: string): ExternalOCRService {
  const selectedProvider = provider || process.env.EXTERNAL_OCR_PROVIDER || 'none';

  switch (selectedProvider.toLowerCase()) {
    case 'google':
    case 'google-vision':
      return new GoogleVisionOCR();

    case 'aws':
    case 'textract':
    case 'aws-textract':
      return new AWSTextractOCR();

    case 'azure':
    case 'form-recognizer':
    case 'azure-form-recognizer':
      return new AzureFormRecognizerOCR();

    case 'ocr-space':
    case 'ocrspace':
      return new OCRSpaceService();

    default:
      throw new Error(
        `Unknown external OCR provider: ${selectedProvider}. ` +
        `Available options: google, aws, azure, ocr-space`
      );
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage:
 *
 * ```typescript
 * import { createExternalOCRService } from './services/ExternalOCRService';
 *
 * // Use OCR.space (free tier)
 * const ocrService = createExternalOCRService('ocr-space');
 * await ocrService.initialize();
 *
 * const buffer = fs.readFileSync('resume.pdf');
 * const result = await ocrService.extractText(buffer, 'resume.pdf');
 *
 * console.log('Extracted text:', result.text);
 * console.log('Confidence:', result.confidence);
 * console.log('Provider:', result.provider);
 * ```
 */

export default {
  GoogleVisionOCR,
  AWSTextractOCR,
  AzureFormRecognizerOCR,
  OCRSpaceService,
  createExternalOCRService,
};
