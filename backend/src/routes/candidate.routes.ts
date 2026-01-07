import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getCollection, COLLECTIONS } from "../config/firebase.js";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * GET /api/v1/candidates/:userId
 * Get all candidates for a user
 */
router.get(
  "/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Fetching candidates for user: ${userId}`);

    const snapshot = await getCollection(COLLECTIONS.APPLICANTS)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const candidates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      data: {
        total: candidates.length,
        candidates,
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * GET /api/v1/candidates/:userId/:jobId
 * Get candidates for a specific job
 */
router.get(
  "/:userId/:jobId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, jobId } = req.params;

    logger.info(`Fetching candidates for user: ${userId}, job: ${jobId}`);

    const snapshot = await getCollection(COLLECTIONS.APPLICANTS)
      .where("userId", "==", userId)
      .where("candidate.jobId", "==", jobId)
      .orderBy("createdAt", "desc")
      .get();

    const candidates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      data: {
        total: candidates.length,
        jobId,
        candidates,
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * GET /api/v1/candidates/:userId/stats
 * Get candidate statistics for a user
 */
router.get(
  "/:userId/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Fetching statistics for user: ${userId}`);

    const snapshot = await getCollection(COLLECTIONS.APPLICANTS)
      .where("userId", "==", userId)
      .get();

    const candidates = snapshot.docs.map((doc) => doc.data());

    const stats = {
      total: candidates.length,
      queued: candidates.filter((c: any) => c.status === "queued").length,
      processing: candidates.filter((c: any) => c.status === "processing")
        .length,
      completed: candidates.filter((c: any) => c.status === "completed").length,
      accepted: candidates.filter((c: any) => c.status === "accepted").length,
      rejected: candidates.filter((c: any) => c.status === "rejected").length,
      failed: candidates.filter((c: any) => c.status === "failed").length,
    };

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * DELETE /api/v1/candidates/:userId/:candidateId
 * Delete a specific candidate
 */
router.delete(
  "/:userId/:candidateId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, candidateId } = req.params;

    logger.info(`Deleting candidate: ${candidateId} for user: ${userId}`);

    // Verify the candidate belongs to the user
    const doc = await getCollection(COLLECTIONS.APPLICANTS)
      .doc(candidateId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Candidate not found",
      });
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized to delete this candidate",
      });
    }

    await getCollection(COLLECTIONS.APPLICANTS).doc(candidateId).delete();

    res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
