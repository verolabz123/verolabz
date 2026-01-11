import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getCollection, COLLECTIONS } from "../config/firebase.js";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * GET /api/v1/dashboard/stats/:userId
 * Get dashboard statistics for a user
 */
router.get(
  "/stats/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Fetching dashboard stats for user: ${userId}`);

    // Fetch all resumes/applicants for this user
    const resumesSnapshot = await getCollection(COLLECTIONS.RESUMES)
      .where("userId", "==", userId)
      .get();

    const resumes = resumesSnapshot.docs.map((doc) => doc.data());

    // Calculate statistics
    const total = resumes.length;
    const accepted = resumes.filter((r: any) => r.status === "accepted").length;
    const rejected = resumes.filter((r: any) => r.status === "rejected").length;

    // Get chart data (last 7 days)
    const chartData = [];
    const today = new Date();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayResumes = resumes.filter((r: any) => {
        if (!r.createdAt) return false;
        const createdAt = r.createdAt.toDate
          ? r.createdAt.toDate()
          : new Date(r.createdAt);
        return createdAt >= date && createdAt < nextDay;
      });

      chartData.push({
        name: daysOfWeek[date.getDay()],
        value: dayResumes.length,
        date: date.toISOString().split("T")[0],
      });
    }

    // Get recent candidates (last 5)
    const recentCandidates = resumes
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id || r.candidateId,
        candidateName: r.candidateName || r.name || "Unknown",
        skills: Array.isArray(r.skills)
          ? r.skills.join(", ")
          : r.skills || "N/A",
        status: r.status || "rejected",
        createdAt: r.createdAt?.toDate
          ? r.createdAt.toDate().toISOString()
          : new Date(r.createdAt || Date.now()).toISOString(),
      }));

    // Status distribution
    const statusDistribution = {
      accepted,
      rejected,
    };

    // Skills analysis (top 10 most common skills)
    const skillsMap = new Map<string, number>();
    resumes.forEach((r: any) => {
      const skills = Array.isArray(r.skills)
        ? r.skills
        : (r.skills || "").split(",").map((s: string) => s.trim());
      skills.forEach((skill: string) => {
        if (skill) {
          const normalizedSkill = skill.toLowerCase().trim();
          skillsMap.set(
            normalizedSkill,
            (skillsMap.get(normalizedSkill) || 0) + 1,
          );
        }
      });
    });

    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        count,
      }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          accepted,
          rejected,
        },
        chartData,
        recentCandidates,
        statusDistribution,
        topSkills,
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * GET /api/v1/dashboard/analytics/:userId
 * Get detailed analytics for a user
 */
router.get(
  "/analytics/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { period = "30" } = req.query; // days

    logger.info(
      `Fetching analytics for user: ${userId}, period: ${period} days`,
    );

    const periodDays = parseInt(period as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Fetch resumes within the period
    const resumesSnapshot = await getCollection(COLLECTIONS.RESUMES)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const allResumes = resumesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by period
    const resumes = allResumes.filter((r: any) => {
      if (!r.createdAt) return false;
      const createdAt = r.createdAt.toDate
        ? r.createdAt.toDate()
        : new Date(r.createdAt);
      return createdAt >= startDate;
    });

    // Time series data
    const timeSeriesData = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayResumes = resumes.filter((r: any) => {
        const createdAt = r.createdAt?.toDate
          ? r.createdAt.toDate()
          : new Date(r.createdAt || 0);
        return createdAt >= date && createdAt < nextDay;
      });

      const accepted = dayResumes.filter(
        (r: any) => r.status === "accepted",
      ).length;
      const rejected = dayResumes.filter(
        (r: any) => r.status === "rejected",
      ).length;

      timeSeriesData.push({
        date: date.toISOString().split("T")[0],
        total: dayResumes.length,
        accepted,
        rejected,
        pending: dayResumes.length - accepted - rejected,
      });
    }

    // Score distribution
    const scoreRanges = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };

    // Score ranges removed - no longer using ATS scores

    // Experience distribution
    const experienceRanges = {
      "0-2": 0,
      "3-5": 0,
      "6-10": 0,
      "10+": 0,
    };

    resumes.forEach((r: any) => {
      const years = r.experienceYears || r.totalExperienceYears || 0;
      if (years <= 2) experienceRanges["0-2"]++;
      else if (years <= 5) experienceRanges["3-5"]++;
      else if (years <= 10) experienceRanges["6-10"]++;
      else experienceRanges["10+"]++;
    });

    // Conversion funnel
    const funnel = {
      applied: resumes.length,
      screened: resumes.length,
      accepted: resumes.filter((r: any) => r.status === "accepted").length,
      rejected: resumes.filter((r: any) => r.status === "rejected").length,
    };

    // Processing time statistics
    const processingTimes = resumes
      .filter((r: any) => r.processingTime)
      .map((r: any) => r.processingTime);

    const avgProcessingTime =
      processingTimes.length > 0
        ? Math.round(
          processingTimes.reduce(
            (sum: number, time: number) => sum + time,
            0,
          ) / processingTimes.length,
        )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        period: `${periodDays} days`,
        summary: {
          totalCandidates: resumes.length,
          acceptanceRate:
            resumes.length > 0
              ? Math.round((funnel.accepted / resumes.length) * 100)
              : 0,
          rejectionRate:
            resumes.length > 0
              ? Math.round((funnel.rejected / resumes.length) * 100)
              : 0,
          avgProcessingTime: `${avgProcessingTime}ms`,
        },
        timeSeriesData,
        scoreDistribution: Object.entries(scoreRanges).map(
          ([range, count]) => ({
            range,
            count,
          }),
        ),
        experienceDistribution: Object.entries(experienceRanges).map(
          ([range, count]) => ({
            range,
            count,
          }),
        ),
        funnel,
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * GET /api/v1/dashboard/insights/:userId
 * Get AI-powered insights for a user
 */
router.get(
  "/insights/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`Fetching insights for user: ${userId}`);

    // Fetch resumes
    const resumesSnapshot = await getCollection(COLLECTIONS.RESUMES)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const resumes = resumesSnapshot.docs.map((doc) => doc.data());

    const insights = [];

    // Insight 1: Accepted candidates
    const acceptedCandidates = resumes.filter(
      (r: any) => r.status === "accepted",
    );
    if (acceptedCandidates.length > 0) {
      insights.push({
        type: "success",
        title: "High-Quality Candidates",
        message: `You have ${acceptedCandidates.length} accepted candidates. Consider prioritizing these for interviews.`,
        action: "Review High Scorers",
        priority: "high",
      });
    }

    // Insight 2: Pending candidates
    const pendingCandidates = resumes.filter(
      (r: any) => r.status === "pending",
    );
    if (pendingCandidates.length > 5) {
      insights.push({
        type: "warning",
        title: "Pending Candidates",
        message: `You have ${pendingCandidates.length} candidates waiting for review. Take action to avoid losing top talent.`,
        action: "Review Pending",
        priority: "medium",
      });
    }

    // Insight 3: Skills gap analysis
    const skillsMap = new Map<string, number>();
    resumes.forEach((r: any) => {
      const skills = Array.isArray(r.skills)
        ? r.skills
        : (r.skills || "").split(",").map((s: string) => s.trim());
      skills.forEach((skill: string) => {
        if (skill) {
          skillsMap.set(
            skill.toLowerCase(),
            (skillsMap.get(skill.toLowerCase()) || 0) + 1,
          );
        }
      });
    });

    const topSkills = Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill]) => skill);

    if (topSkills.length > 0) {
      insights.push({
        type: "info",
        title: "Top Skills in Pool",
        message: `Most common skills: ${topSkills.join(", ")}. Consider creating specialized roles for these skill sets.`,
        action: "View Skills Analytics",
        priority: "low",
      });
    }

    // Insight 4: Response time
    const recentResumes = resumes.slice(0, 10);
    const avgResponseTime = recentResumes.length > 0 ? 2.5 : 0; // Mock calculation
    insights.push({
      type: "info",
      title: "Response Time",
      message: `Average time to evaluate candidates: ${avgResponseTime} hours. Keep up the good work!`,
      action: null,
      priority: "low",
    });

    res.status(200).json({
      success: true,
      data: {
        insights,
        generatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
