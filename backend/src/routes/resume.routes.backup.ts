import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCollection, COLLECTIONS, createDocument, updateDocument, getStorageInstance } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { body, validationResult } from 'express-validator';
import admin from 'firebase-admin';
import { parseResumeFile } from '../utils/resumeParser.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Parse resume text from file
 */
async function parseResumeFile(filePath: string, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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

/**
 * Upload file to Firebase Storage
 */
async function uploadToFirebaseStorage(
  filePath: string,
  fileName: string,
  userId: string
): Promise<string> {
  try {
    const bucket = getStorageInstance().bucket();
    const destination = `resumes/${userId}/${fileName}`;

    await bucket.upload(filePath, {
      destination,
      metadata: {
        contentType: 'application/octet-stream',
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Get signed URL (valid for 1 year)
    const file = bucket.file(destination);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    return url;
  } catch (error) {
    logger.error('Error uploading to Firebase Storage:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * GET /api/v1/resumes/:userId
 * Get all resumes for a user
 */
router.get(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status, limit = '50', offset = '0' } = req.query;

    logger.info(`Fetching resumes for user: ${userId}`);

    let query = getCollection(COLLECTIONS.RESUMES)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10))
      .get();

    const resumes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      data: {
        total: resumes.length,
        resumes,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/v1/resumes/:userId/:resumeId
 * Get a specific resume
 */
router.get(
  '/:userId/:resumeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, resumeId } = req.params;

    logger.info(`Fetching resume: ${resumeId} for user: ${userId}`);

    const doc = await getCollection(COLLECTIONS.RESUMES).doc(resumeId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access this resume',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...data,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/v1/resumes/:userId/upload
 * Upload and process resume
 */
router.post(
  '/:userId/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    logger.info(`Processing resume upload for user: ${userId}, file: ${file.originalname}`);

    try {
      // Parse resume text
      const resumeText = await parseResumeFile(file.path, file.mimetype);

      // Upload to Firebase Storage
      const fileUrl = await uploadToFirebaseStorage(file.path, file.filename, userId);

      // Create resume document in Firestore
      const resumeData = {
        userId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        resumeText,
        status: 'pending',
        candidateName: 'Processing...',
        candidateEmail: '',
        candidatePhone: '',
        skills: [],
        experienceYears: 0,
        atsScore: 0,
        aiReasoning: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await getCollection(COLLECTIONS.RESUMES).add(resumeData);

      // Clean up local file
      fs.unlinkSync(file.path);

      logger.info(`Resume uploaded successfully: ${docRef.id}`);

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: {
          id: docRef.id,
          ...resumeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Clean up local file on error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  })
);

/**
 * POST /api/v1/resumes/:userId/upload-multiple
 * Upload multiple resumes at once
 */
router.post(
  '/:userId/upload-multiple',
  upload.array('files', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    logger.info(`Processing ${files.length} resume uploads for user: ${userId}`);

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Parse resume text
        const resumeText = await parseResumeFile(file.path, file.mimetype);

        // Upload to Firebase Storage
        const fileUrl = await uploadToFirebaseStorage(file.path, file.filename, userId);

        // Create resume document
        const resumeData = {
          userId,
          fileName: file.originalname,
          fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          resumeText,
          status: 'pending',
          candidateName: 'Processing...',
          candidateEmail: '',
          candidatePhone: '',
          skills: [],
          experienceYears: 0,
          atsScore: 0,
          aiReasoning: '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await getCollection(COLLECTIONS.RESUMES).add(resumeData);

        results.push({
          id: docRef.id,
          fileName: file.originalname,
          success: true,
        });

        // Clean up local file
        fs.unlinkSync(file.path);
      } catch (error: any) {
        errors.push({
          fileName: file.originalname,
          error: error.message,
        });

        // Clean up local file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    logger.info(`Bulk upload completed: ${results.length} successful, ${errors.length} failed`);

    res.status(200).json({
      success: true,
      message: `Uploaded ${results.length} of ${files.length} resumes`,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/resumes/:userId/:resumeId
 * Update resume status or data
 */
router.patch(
  '/:userId/:resumeId',
  [
    body('status').optional().isIn(['pending', 'processing', 'completed', 'shortlisted', 'rejected', 'interviewed', 'hired']),
    body('candidateName').optional().notEmpty(),
    body('candidateEmail').optional().isEmail(),
    body('candidatePhone').optional(),
    body('skills').optional().isArray(),
    body('experienceYears').optional().isNumeric(),
    body('atsScore').optional().isNumeric(),
    body('aiReasoning').optional(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { userId, resumeId } = req.params;
    const updateData = req.body;

    logger.info(`Updating resume: ${resumeId} for user: ${userId}`);

    // Verify resume exists and belongs to user
    const doc = await getCollection(COLLECTIONS.RESUMES).doc(resumeId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this resume',
      });
    }

    // Update resume
    const updates = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await getCollection(COLLECTIONS.RESUMES).doc(resumeId).update(updates);

    // Fetch updated document
    const updatedDoc = await getCollection(COLLECTIONS.RESUMES).doc(resumeId).get();

    logger.info(`Resume updated successfully: ${resumeId}`);

    res.status(200).json({
      success: true,
      message: 'Resume updated successfully',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/v1/resumes/:userId/:resumeId
 * Delete a resume
 */
router.delete(
  '/:userId/:resumeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, resumeId } = req.params;

    logger.info(`Deleting resume: ${resumeId} for user: ${userId}`);

    // Verify resume exists and belongs to user
    const doc = await getCollection(COLLECTIONS.RESUMES).doc(resumeId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this resume',
      });
    }

    // Delete file from Firebase Storage (optional)
    try {
      if (data?.fileUrl) {
        const bucket = getStorageInstance().bucket();
        const fileName = `resumes/${userId}/${path.basename(data.fileUrl)}`;
        await bucket.file(fileName).delete();
      }
    } catch (error) {
      logger.warn(`Could not delete file from storage: ${error}`);
    }

    // Delete document
    await getCollection(COLLECTIONS.RESUMES).doc(resumeId).delete();

    logger.info(`Resume deleted successfully: ${resumeId}`);

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/v1/resumes/:userId/:resumeId/evaluate
 * Trigger evaluation for a resume
 */
router.post(
  '/:userId/:resumeId/evaluate',
  [
    body('jobId').notEmpty().withMessage('Job ID is required'),
    body('jobTitle').notEmpty().withMessage('Job title is required'),
    body('jobDescription').notEmpty().withMessage('Job description is required'),
    body('requiredSkills').isArray().withMessage('Required skills must be an array'),
    body('requiredExperience').isNumeric().withMessage('Required experience must be a number'),
    body('seniorityLevel').isIn(['entry', 'mid', 'senior', 'lead', 'executive']),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { userId, resumeId } = req.params;
    const {
      jobId,
      jobTitle,
      jobDescription,
      requiredSkills,
      preferredSkills,
      requiredExperience,
      seniorityLevel,
      industryPreference,
    } = req.body;

    logger.info(`Triggering evaluation for resume: ${resumeId}`);

    // Verify resume exists
    const doc = await getCollection(COLLECTIONS.RESUMES).doc(resumeId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    const resumeData = doc.data();
    if (resumeData?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to evaluate this resume',
      });
    }

    // Update status to processing
    await getCollection(COLLECTIONS.RESUMES).doc(resumeId).update({
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return immediate response - evaluation will happen in background
    // The actual evaluation should be triggered via a message queue or webhook
    res.status(202).json({
      success: true,
      message: 'Evaluation queued successfully',
      data: {
        resumeId,
        status: 'processing',
        estimatedTime: '2-3 minutes',
      },
      timestamp: new Date().toISOString(),
    });

    // Note: In production, you would trigger the evaluation service here
    // For example, by calling the evaluation API endpoint or adding to a queue
  })
);

export default router;
