import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCollection, COLLECTIONS, updateDocument } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { body, validationResult } from 'express-validator';
import admin from 'firebase-admin';

const router = Router();

/**
 * GET /api/v1/user/profile/:userId
 * Get user profile
 */
router.get(
  '/profile/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Fetching profile for user: ${userId}`);

    const userDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();

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
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/user/profile/:userId
 * Update user profile
 */
router.patch(
  '/profile/:userId',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('company').optional(),
    body('role').optional(),
    body('emailNotifications').optional().isBoolean(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const { name, company, role, emailNotifications } = req.body;

    logger.info(`Updating profile for user: ${userId}`);

    // Verify user exists
    const userDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Build update data
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (role !== undefined) updateData.role = role;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    // Update user document
    await getCollection(COLLECTIONS.USERS).doc(userId).update(updateData);

    // Also update Firebase Auth display name if name changed
    if (name !== undefined) {
      try {
        await admin.auth().updateUser(userId, {
          displayName: name,
        });
      } catch (error) {
        logger.warn(`Could not update Firebase Auth display name: ${error}`);
      }
    }

    // Fetch updated user data
    const updatedDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();
    const updatedData = updatedDoc.data();
    const { password, ...userWithoutPassword } = updatedData as any;

    logger.info(`Profile updated successfully for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          ...userWithoutPassword,
          id: updatedDoc.id,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/user/plan/:userId
 * Update user subscription plan
 */
router.patch(
  '/plan/:userId',
  [
    body('plan').isIn(['free_trial', 'starter', 'pro', 'enterprise']).withMessage('Invalid plan type'),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { userId } = req.params;
    const { plan } = req.body;

    logger.info(`Updating plan for user: ${userId} to ${plan}`);

    // Verify user exists
    const userDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update plan
    await getCollection(COLLECTIONS.USERS).doc(userId).update({
      plan,
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Fetch updated user data
    const updatedDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();
    const updatedData = updatedDoc.data();
    const { password, ...userWithoutPassword } = updatedData as any;

    logger.info(`Plan updated successfully for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: {
        user: {
          ...userWithoutPassword,
          id: updatedDoc.id,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/v1/user/:userId/settings
 * Get user settings
 */
router.get(
  '/:userId/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Fetching settings for user: ${userId}`);

    const userDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    const settings = {
      emailNotifications: userData?.emailNotifications ?? true,
      plan: userData?.plan ?? 'free_trial',
      company: userData?.company ?? '',
      role: userData?.role ?? 'HR Manager',
    };

    res.status(200).json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PATCH /api/v1/user/:userId/settings
 * Update user settings
 */
router.patch(
  '/:userId/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const settings = req.body;

    logger.info(`Updating settings for user: ${userId}`);

    // Verify user exists
    const userDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update settings
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (settings.emailNotifications !== undefined) {
      updateData.emailNotifications = settings.emailNotifications;
    }
    if (settings.company !== undefined) {
      updateData.company = settings.company;
    }
    if (settings.role !== undefined) {
      updateData.role = settings.role;
    }

    await getCollection(COLLECTIONS.USERS).doc(userId).update(updateData);

    logger.info(`Settings updated successfully for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * DELETE /api/v1/user/:userId
 * Delete user account
 */
router.delete(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Deleting user account: ${userId}`);

    // Verify user exists
    const userDoc = await getCollection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete user from Firebase Auth
    try {
      await admin.auth().deleteUser(userId);
    } catch (error) {
      logger.error(`Error deleting user from Firebase Auth: ${error}`);
    }

    // Delete user document from Firestore
    await getCollection(COLLECTIONS.USERS).doc(userId).delete();

    // Optionally: Delete user's data (resumes, evaluations, etc.)
    // This should be done in a background job for better performance

    logger.info(`User account deleted successfully: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
