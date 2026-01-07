import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCollection, COLLECTIONS } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { body, validationResult } from 'express-validator';
import admin from 'firebase-admin';
import { parseResumeFile } from '../utils/resumeParser.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Note: Firebase Storage upload temporarily disabled
// Files will be stored locally for now

router.get('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  res.json({ success: true, data: { resumes: [] } });
}));

router.post('/:userId/upload', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Upload endpoint ready' });
}));

export default router;
