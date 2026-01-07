import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCollection, COLLECTIONS, createDocument, getDocument } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { body, validationResult } from 'express-validator';
import admin from 'firebase-admin';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, name, company, role } = req.body;

    logger.info(`Registration attempt for email: ${email}`);

    try {
      // Check if user already exists in Firestore
      const usersSnapshot = await getCollection(COLLECTIONS.USERS)
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        return res.status(400).json({
          success: false,
          error: 'User already exists with this email',
        });
      }

      // Create user in Firebase Auth
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().createUser({
          email: email.toLowerCase(),
          password: password,
          displayName: name,
          emailVerified: false,
        });
      } catch (authError: any) {
        logger.error('Firebase Auth error:', authError);

        if (authError.code === 'auth/email-already-exists') {
          return res.status(400).json({
            success: false,
            error: 'User already exists with this email',
          });
        }

        throw authError;
      }

      // Hash password for Firestore backup
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user document in Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        company: company || '',
        role: role || 'HR Manager',
        plan: 'free_trial',
        emailNotifications: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await getCollection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);

      logger.info(`User registered successfully: ${email} (${firebaseUser.uid})`);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = userData;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            ...userWithoutPassword,
            uid: firebaseUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  })
);

/**
 * POST /api/v1/auth/login
 * Login user (verification endpoint)
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    // Get user from Firestore
    const usersSnapshot = await getCollection(COLLECTIONS.USERS)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Get Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email.toLowerCase());
    } catch (error) {
      logger.error('Error fetching Firebase user:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }

    logger.info(`User logged in successfully: ${email} (${userDoc.id})`);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = userData;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...userWithoutPassword,
          id: userDoc.id,
          uid: firebaseUser.uid,
        },
      },
    });
  })
);

/**
 * POST /api/v1/auth/verify-token
 * Verify Firebase ID token
 */
router.post(
  '/verify-token',
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'ID token is required',
      });
    }

    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get user data from Firestore
      const userDoc = await getCollection(COLLECTIONS.USERS).doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const userData = userDoc.data();
      const { password, ...userWithoutPassword } = userData as any;

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...userWithoutPassword,
            id: userDoc.id,
            uid: decodedToken.uid,
          },
        },
      });
    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout user (revoke refresh tokens)
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    try {
      // Revoke all refresh tokens for the user
      await admin.auth().revokeRefreshTokens(uid);

      logger.info(`User logged out: ${uid}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  })
);

/**
 * POST /api/v1/auth/reset-password
 * Send password reset email
 */
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    logger.info(`Password reset requested for: ${email}`);

    try {
      // Generate password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email.toLowerCase());

      // In production, you would send this via email
      // For now, we'll just return success
      logger.info(`Password reset link generated for: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
        // Don't send the link in production!
        ...(process.env.NODE_ENV === 'development' && { resetLink }),
      });
    } catch (error: any) {
      logger.error('Password reset error:', error);

      // Don't reveal if email exists or not for security
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  })
);

export default router;
