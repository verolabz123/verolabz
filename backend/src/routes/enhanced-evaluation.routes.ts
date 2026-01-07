import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import EnhancedEvaluationService from "../services/EnhancedEvaluationService.js";
import { logger } from "../utils/logger.js";
import { body, validationResult } from "express-validator";

const router = Router();

// Lazy initialization to ensure env vars are loaded
let evaluationService: EnhancedEvaluationService | null = null;

function getEvaluationService(): EnhancedEvaluationService {
  if (!evaluationService) {
    evaluationService = new EnhancedEvaluationService();
  }
  return evaluationService;
}

/**
 * POST /api/v1/enhanced-evaluation/evaluate
 * Evaluate a single candidate using LangGraph workflow
 */
router.post(
  "/evaluate",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("candidateName").notEmpty().withMessage("Candidate name is required"),
    body("candidateEmail").isEmail().withMessage("Valid email is required"),
    body("resumeText").notEmpty().withMessage("Resume text is required"),
    body("resumeUrl").notEmpty().withMessage("Resume URL is required"),
    body("jobId").notEmpty().withMessage("Job ID is required"),
    body("jobTitle").notEmpty().withMessage("Job title is required"),
    body("jobDescription")
      .notEmpty()
      .withMessage("Job description is required"),
    body("requiredSkills")
      .isArray({ min: 1 })
      .withMessage("Required skills must be a non-empty array"),
    body("requiredExperience")
      .isNumeric()
      .withMessage("Required experience must be a number"),
    body("seniorityLevel")
      .isIn(["entry", "mid", "senior", "lead", "executive"])
      .withMessage("Invalid seniority level"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

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

    logger.info(
      `[Enhanced Evaluation] Received request for: ${candidateName} (${candidateEmail})`,
    );

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

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Candidate evaluated successfully",
        data: {
          candidateId: result.candidateId,
          finalScore: result.finalScore,
          decision: result.decision,
          confidence: result.confidence,
          status: result.status,
          parsedResume: {
            name: result.parsedResume?.name,
            email: result.parsedResume?.email,
            phone: result.parsedResume?.phone,
            summary: result.parsedResume?.summary,
            skills: result.parsedResume?.skills,
            totalExperienceYears: result.parsedResume?.totalExperienceYears,
            education: result.parsedResume?.education,
            certifications: result.parsedResume?.certifications,
          },
          skillsEvaluation: {
            overallScore: result.skillsEvaluation?.overallScore,
            matchedRequiredSkills:
              result.skillsEvaluation?.matchedRequiredSkills,
            missingRequiredSkills:
              result.skillsEvaluation?.missingRequiredSkills,
            strengthAreas: result.skillsEvaluation?.strengthAreas,
            weaknessAreas: result.skillsEvaluation?.weaknessAreas,
            technicalDepth: result.skillsEvaluation?.technicalDepth,
          },
          experienceEvaluation: {
            overallScore: result.experienceEvaluation?.overallScore,
            careerProgression: result.experienceEvaluation?.careerProgression,
            seniorityMatch: result.experienceEvaluation?.seniorityMatch,
            keyAchievements: result.experienceEvaluation?.keyAchievements,
          },
          culturalFit: {
            overallScore: result.culturalFit?.overallScore,
            communicationStyle: result.culturalFit?.communicationStyle,
            workStyle: result.culturalFit?.workStyle,
            adaptability: result.culturalFit?.adaptability,
          },
          processingTime: result.processingTime,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Evaluation failed",
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

/**
 * POST /api/v1/enhanced-evaluation/batch
 * Evaluate multiple candidates
 */
router.post(
  "/batch",
  [
    body("candidates")
      .isArray({ min: 1 })
      .withMessage("Candidates must be a non-empty array"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { candidates } = req.body;

    logger.info(
      `[Enhanced Evaluation] Starting batch evaluation for ${candidates.length} candidates`,
    );

    const results = await getEvaluationService().evaluateCandidates(candidates);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Batch evaluation completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results.map((r) => ({
          candidateId: r.candidateId,
          candidateName: r.parsedResume?.name,
          success: r.success,
          finalScore: r.finalScore,
          decision: r.decision,
          status: r.status,
          error: r.error,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * POST /api/v1/enhanced-evaluation/parse-resume
 * Parse resume without full evaluation
 */
router.post(
  "/parse-resume",
  [body("resumeText").notEmpty().withMessage("Resume text is required")],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { resumeText, candidateName, candidateEmail, candidatePhone } =
      req.body;

    logger.info("[Enhanced Evaluation] Parsing resume");

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
      message: "Resume parsed successfully",
      data: parsedResume,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * POST /api/v1/enhanced-evaluation/quick-skills
 * Quick skills match assessment
 */
router.post(
  "/quick-skills",
  [
    body("candidateSkills")
      .isArray({ min: 1 })
      .withMessage("Candidate skills must be a non-empty array"),
    body("requiredSkills")
      .isArray({ min: 1 })
      .withMessage("Required skills must be a non-empty array"),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { candidateSkills, requiredSkills, preferredSkills } = req.body;

    logger.info("[Enhanced Evaluation] Quick skills evaluation");

    const result = await getEvaluationService().quickSkillsEvaluation(
      candidateSkills,
      requiredSkills,
      preferredSkills,
    );

    res.status(200).json({
      success: result.success,
      data: result.success
        ? {
            overallScore: result.overallScore,
            matchedRequiredSkills: result.matchedRequiredSkills,
            missingRequiredSkills: result.missingRequiredSkills,
            matchedPreferredSkills: result.matchedPreferredSkills,
            requiredMatchPercentage: result.requiredMatchPercentage,
            recommendation: result.recommendation,
          }
        : null,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  }),
);

/**
 * POST /api/v1/enhanced-evaluation/re-evaluate/:candidateId
 * Re-evaluate an existing candidate
 */
router.post(
  "/re-evaluate/:candidateId",
  asyncHandler(async (req: Request, res: Response) => {
    const { candidateId } = req.params;
    const updates = req.body;

    logger.info(
      `[Enhanced Evaluation] Re-evaluating candidate: ${candidateId}`,
    );

    try {
      const result = await getEvaluationService().reEvaluateCandidate(
        candidateId,
        updates,
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Candidate re-evaluated successfully",
          data: {
            candidateId: result.candidateId || candidateId,
            finalScore: result.finalScore,
            decision: result.decision,
            confidence: result.confidence,
            status: result.status,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || "Re-evaluation failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || "Candidate not found",
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

/**
 * GET /api/v1/enhanced-evaluation/stats/:userId
 * Get evaluation statistics for a user
 */
router.get(
  "/stats/:userId",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    logger.info(`[Enhanced Evaluation] Fetching stats for user: ${userId}`);

    const result = await getEvaluationService().getUserStats(userId);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Failed to fetch stats",
        timestamp: new Date().toISOString(),
      });
    }
  }),
);

/**
 * GET /api/v1/enhanced-evaluation/agents
 * Get information about the AI agents and workflow
 */
router.get("/agents", (req: Request, res: Response) => {
  const agentsInfo = getEvaluationService().getAgentsInfo();

  res.status(200).json({
    success: true,
    data: agentsInfo,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/enhanced-evaluation/workflow
 * Get LangGraph workflow information
 */
router.get("/workflow", (req: Request, res: Response) => {
  const workflowInfo = getEvaluationService().getAgentsInfo();

  res.status(200).json({
    success: true,
    data: {
      name: "LangGraph Multi-Agent Evaluation Workflow",
      description: "AI-powered candidate evaluation using coordinated agents",
      orchestrator: workflowInfo.orchestrator,
      version: workflowInfo.version,
      pipeline: [
        {
          step: 1,
          name: "Resume Parsing",
          description: "Extract structured information from resume text",
          agent: "Resume Parser Agent",
        },
        {
          step: 2,
          name: "Skills Evaluation",
          description: "Assess technical and soft skills match",
          agent: "Skills Evaluator Agent",
          weight: "40%",
        },
        {
          step: 3,
          name: "Experience Evaluation",
          description: "Analyze work experience and career progression",
          agent: "Experience Evaluator Agent",
          weight: "35%",
        },
        {
          step: 4,
          name: "Cultural Fit",
          description: "Evaluate cultural fit indicators",
          agent: "Cultural Fit Agent",
          weight: "25%",
        },
        {
          step: 5,
          name: "Final Scoring",
          description: "Synthesize evaluations and make hiring decision",
          agent: "Final Scoring Agent",
        },
      ],
      features: workflowInfo.features,
      model: "Groq LLM with LangGraph Orchestration",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
