import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import EvaluationService from "../services/EvaluationService.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Lazy initialization to ensure env vars are loaded
let evaluationService: EvaluationService | null = null;

function getEvaluationService(): EvaluationService {
  if (!evaluationService) {
    evaluationService = new EvaluationService();
  }
  return evaluationService;
}

/**
 * POST /api/v1/evaluation/evaluate
 * Evaluate a single candidate
 */
router.post(
  "/evaluate",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      candidateName,
      candidateEmail,
      candidatePhone,
      resumeText,
      resumeUrl,
      jobId,
      jobTitle,
      jobDescription,
      requiredSkills,
      preferredSkills,
      requiredExperience,
      seniorityLevel,
      industryPreference,
    } = req.body;

    // Validation
    if (
      !userId ||
      !candidateName ||
      !candidateEmail ||
      !resumeUrl ||
      !jobId ||
      !jobTitle ||
      !jobDescription
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: userId, candidateName, candidateEmail, resumeUrl, jobId, jobTitle, jobDescription",
      });
    }

    if (
      !requiredSkills ||
      !Array.isArray(requiredSkills) ||
      requiredSkills.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "requiredSkills must be a non-empty array",
      });
    }

    if (!requiredExperience || typeof requiredExperience !== "number") {
      return res.status(400).json({
        success: false,
        error: "requiredExperience must be a number",
      });
    }

    if (
      !seniorityLevel ||
      !["entry", "mid", "senior", "lead", "executive"].includes(seniorityLevel)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "seniorityLevel must be one of: entry, mid, senior, lead, executive",
      });
    }

    logger.info(
      `Received evaluation request for: ${candidateName} (${candidateEmail})`,
    );

    // Evaluate candidate
    const result = await getEvaluationService().evaluateCandidate({
      userId,
      candidateName,
      candidateEmail,
      candidatePhone,
      resumeText,
      resumeUrl,
      jobId,
      jobTitle,
      jobDescription,
      requiredSkills,
      preferredSkills: preferredSkills || [],
      requiredExperience,
      seniorityLevel,
      industryPreference,
    });

    res.status(200).json({
      success: result.success,
      data: {
        candidateId: result.candidateId,
        finalScore: result.finalScore,
        decision: result.decision,
        confidence: result.confidence,
        componentScores: result.finalScoring.componentScores,
        strengths: result.finalScoring.strengths,
        weaknesses: result.finalScoring.weaknesses,
        recommendations: result.finalScoring.recommendations,
        interviewSuggestions: result.finalScoring.interviewSuggestions,
        detailedReasoning: result.finalScoring.detailedReasoning,
        parsedResume: {
          name: result.parsedResume.name,
          email: result.parsedResume.email,
          phone: result.parsedResume.phone,
          skills: result.parsedResume.skills,
          totalExperienceYears: result.parsedResume.totalExperienceYears,
          education: result.parsedResume.education,
          certifications: result.parsedResume.certifications,
        },
        skillsEvaluation: {
          overallScore: result.skillsEvaluation.overallScore,
          matchedSkills: result.skillsEvaluation.matchedSkills,
          missingCriticalSkills: result.skillsEvaluation.missingCriticalSkills,
          strengthAreas: result.skillsEvaluation.strengthAreas,
          weaknessAreas: result.skillsEvaluation.weaknessAreas,
        },
        experienceEvaluation: {
          overallScore: result.experienceEvaluation.overallScore,
          yearsMatchScore: result.experienceEvaluation.yearsMatchScore,
          relevanceScore: result.experienceEvaluation.relevanceScore,
          progressionScore: result.experienceEvaluation.progressionScore,
          leadershipScore: result.experienceEvaluation.leadershipScore,
          careerProgression: result.experienceEvaluation.careerProgression,
          isSeniorityMatch: result.experienceEvaluation.isSeniorityMatch,
        },
        processingTime: result.processingTime,
      },
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * POST /api/v1/evaluation/parse-resume
 * Parse resume without evaluation
 */
router.post(
  "/parse-resume",
  asyncHandler(async (req: Request, res: Response) => {
    const { resumeText, candidateName, candidateEmail, candidatePhone } =
      req.body;

    if (
      !resumeText ||
      typeof resumeText !== "string" ||
      resumeText.trim().length < 50
    ) {
      return res.status(400).json({
        success: false,
        error: "resumeText is required and must be at least 50 characters",
      });
    }

    logger.info("Received resume parsing request");

    const parsedResume = await getEvaluationService().parseResumeOnly(
      resumeText,
      {
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
      },
    );

    res.status(200).json({
      success: true,
      data: parsedResume,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * POST /api/v1/evaluation/quick-skills
 * Quick skills match assessment
 */
router.post(
  "/quick-skills",
  asyncHandler(async (req: Request, res: Response) => {
    const { candidateSkills, requiredSkills, preferredSkills } = req.body;

    if (
      !candidateSkills ||
      !Array.isArray(candidateSkills) ||
      candidateSkills.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "candidateSkills must be a non-empty array",
      });
    }

    if (
      !requiredSkills ||
      !Array.isArray(requiredSkills) ||
      requiredSkills.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "requiredSkills must be a non-empty array",
      });
    }

    logger.info("Received quick skills evaluation request");

    const result = await getEvaluationService().quickSkillsEvaluation(
      candidateSkills,
      requiredSkills,
      preferredSkills,
    );

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * POST /api/v1/evaluation/batch
 * Evaluate multiple candidates
 */
router.post(
  "/batch",
  asyncHandler(async (req: Request, res: Response) => {
    const { candidates } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        error: "candidates must be a non-empty array",
      });
    }

    // Validate and provide helpful warnings
    let candidatesWithoutText = 0;
    let candidatesWithCloudUrls = 0;

    candidates.forEach((candidate, index) => {
      if (!candidate.resumeText || candidate.resumeText.trim().length < 50) {
        candidatesWithoutText++;
      }

      if (candidate.resumeUrl) {
        const url = candidate.resumeUrl.toLowerCase();
        if (
          url.includes("drive.google.com") ||
          url.includes("dropbox.com") ||
          url.includes("onedrive.live.com") ||
          url.includes("sharepoint.com")
        ) {
          candidatesWithCloudUrls++;
          logger.warn(
            `⚠️  Candidate ${index + 1} (${candidate.name || "Unknown"}) uses cloud storage URL which may fail. Consider using resume_text instead.`,
          );
        }
      }
    });

    if (candidatesWithoutText > 0) {
      logger.warn(
        `⚠️  ${candidatesWithoutText} candidate(s) missing resume_text. Will attempt URL download or create minimal resumes.`,
      );
      logger.warn(
        `💡 TIP: For best results, include full resume text in the 'resume_text' column of your Excel file.`,
      );
    }

    if (candidatesWithCloudUrls > 0) {
      logger.warn(
        `⚠️  ${candidatesWithCloudUrls} candidate(s) use cloud storage URLs (Google Drive/Dropbox/OneDrive).`,
      );
      logger.warn(
        `   These URLs typically require authentication and will likely fail.`,
      );
      logger.warn(
        `   SOLUTION: Copy resume text from PDFs and paste into 'resume_text' column instead.`,
      );
    }

    logger.info(
      `Received batch evaluation request for ${candidates.length} candidates`,
    );

    const results = await getEvaluationService().evaluateCandidates(candidates);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    res.status(200).json({
      success: true,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results.map((r) => ({
          candidateId: r.candidateId,
          success: r.success,
          finalScore: r.finalScore,
          decision: r.decision,
          confidence: r.confidence,
          error: r.error,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * GET /api/v1/evaluation/agents
 * Get information about AI agents
 */
router.get("/agents", (req: Request, res: Response) => {
  const agentsInfo = getEvaluationService().getAgentsInfo();

  res.status(200).json({
    success: true,
    data: {
      agents: agentsInfo,
      description: "Multi-agent AI system for candidate evaluation",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
