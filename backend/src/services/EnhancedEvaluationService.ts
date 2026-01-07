import { logger } from "../utils/logger.js";
import {
  getCollection,
  COLLECTIONS,
  createDocument,
  updateDocument,
} from "../config/firebase.js";
import LangGraphOrchestrator from "./LangGraphOrchestrator.js";
import admin from "firebase-admin";

/**
 * Enhanced Evaluation Service
 * Integrates LangGraph orchestrator with Firestore for comprehensive candidate evaluation
 */
export class EnhancedEvaluationService {
  private orchestrator: LangGraphOrchestrator;

  constructor() {
    this.orchestrator = new LangGraphOrchestrator();
    logger.info(
      "Enhanced Evaluation Service initialized with LangGraph orchestrator",
    );
  }

  /**
   * Evaluate a single candidate using LangGraph workflow
   */
  async evaluateCandidate(params: {
    userId: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    resumeText: string;
    resumeUrl: string;
    jobId: string;
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    preferredSkills?: string[];
    requiredExperience: number;
    seniorityLevel: string;
    industryPreference?: string;
  }): Promise<any> {
    const startTime = Date.now();

    logger.info(`Starting evaluation for candidate: ${params.candidateName}`);

    try {
      // Execute LangGraph evaluation workflow
      const evaluation = await this.orchestrator.evaluate({
        resumeText: params.resumeText,
        candidateName: params.candidateName,
        candidateEmail: params.candidateEmail,
        candidatePhone: params.candidatePhone,
        jobTitle: params.jobTitle,
        jobDescription: params.jobDescription,
        requiredSkills: params.requiredSkills,
        preferredSkills: params.preferredSkills || [],
        requiredExperience: params.requiredExperience,
        seniorityLevel: params.seniorityLevel,
        industryPreference: params.industryPreference,
      });

      if (!evaluation.success) {
        logger.error(
          `Evaluation failed for ${params.candidateName}: ${evaluation.error}`,
        );
        return {
          success: false,
          error: evaluation.error,
          processingTime: Date.now() - startTime,
        };
      }

      // Prepare candidate data for Firestore
      const candidateData = {
        userId: params.userId,
        candidate: {
          name: evaluation.parsedResume?.name || params.candidateName,
          email: evaluation.parsedResume?.email || params.candidateEmail,
          phone: evaluation.parsedResume?.phone || params.candidatePhone || "",
          resumeUrl: params.resumeUrl,
          jobId: params.jobId,
          jobTitle: params.jobTitle,
        },
        parsedResume: {
          name: evaluation.parsedResume?.name,
          email: evaluation.parsedResume?.email,
          phone: evaluation.parsedResume?.phone,
          summary: evaluation.parsedResume?.summary,
          skills: evaluation.parsedResume?.skills || [],
          experience: evaluation.parsedResume?.experience || [],
          education: evaluation.parsedResume?.education || [],
          certifications: evaluation.parsedResume?.certifications || [],
          totalExperienceYears:
            evaluation.parsedResume?.totalExperienceYears || 0,
          languages: evaluation.parsedResume?.languages || [],
        },
        skillsEvaluation: {
          overallScore: evaluation.skillsEvaluation?.overallScore || 0,
          matchedRequiredSkills:
            evaluation.skillsEvaluation?.matchedRequiredSkills || [],
          missingRequiredSkills:
            evaluation.skillsEvaluation?.missingRequiredSkills || [],
          matchedPreferredSkills:
            evaluation.skillsEvaluation?.matchedPreferredSkills || [],
          additionalSkills: evaluation.skillsEvaluation?.additionalSkills || [],
          strengthAreas: evaluation.skillsEvaluation?.strengthAreas || [],
          weaknessAreas: evaluation.skillsEvaluation?.weaknessAreas || [],
          technicalDepth: evaluation.skillsEvaluation?.technicalDepth || "mid",
          recommendations: evaluation.skillsEvaluation?.recommendations || [],
          reasoning: evaluation.skillsEvaluation?.reasoning || "",
        },
        experienceEvaluation: {
          overallScore: evaluation.experienceEvaluation?.overallScore || 0,
          yearsMatchScore:
            evaluation.experienceEvaluation?.yearsMatchScore || 0,
          relevanceScore: evaluation.experienceEvaluation?.relevanceScore || 0,
          progressionScore:
            evaluation.experienceEvaluation?.progressionScore || 0,
          leadershipScore:
            evaluation.experienceEvaluation?.leadershipScore || 0,
          industryExperience:
            evaluation.experienceEvaluation?.industryExperience || "none",
          careerProgression:
            evaluation.experienceEvaluation?.careerProgression || "stable",
          seniorityMatch:
            evaluation.experienceEvaluation?.seniorityMatch || false,
          keyAchievements:
            evaluation.experienceEvaluation?.keyAchievements || [],
          redFlags: evaluation.experienceEvaluation?.redFlags || [],
          strengths: evaluation.experienceEvaluation?.strengths || [],
          reasoning: evaluation.experienceEvaluation?.reasoning || "",
        },
        culturalFit: {
          overallScore: evaluation.culturalFit?.overallScore || 0,
          communicationStyle:
            evaluation.culturalFit?.communicationStyle || "collaborative",
          workStyle: evaluation.culturalFit?.workStyle || "hybrid",
          adaptability: evaluation.culturalFit?.adaptability || 0,
          initiative: evaluation.culturalFit?.initiative || 0,
          collaboration: evaluation.culturalFit?.collaboration || 0,
          positiveIndicators: evaluation.culturalFit?.positiveIndicators || [],
          concerns: evaluation.culturalFit?.concerns || [],
          reasoning: evaluation.culturalFit?.reasoning || "",
        },
        finalScore: evaluation.finalScore || 0,
        decision: evaluation.decision || "maybe",
        confidence: evaluation.confidence || 0,
        status: this.determineStatus(evaluation.decision),
        processingTime: evaluation.processingTime,
        evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Save to Firestore
      const docId = await createDocument(COLLECTIONS.APPLICANTS, candidateData);

      logger.info(
        `Evaluation completed for ${params.candidateName} - Score: ${evaluation.finalScore}, Decision: ${evaluation.decision}`,
      );

      return {
        success: true,
        candidateId: docId,
        ...evaluation,
        status: candidateData.status,
      };
    } catch (error: any) {
      logger.error(
        `Error evaluating candidate ${params.candidateName}:`,
        error,
      );
      return {
        success: false,
        error: error.message || "Evaluation failed",
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Evaluate multiple candidates in batch
   */
  async evaluateCandidates(candidates: any[]): Promise<any[]> {
    logger.info(
      `Starting batch evaluation for ${candidates.length} candidates`,
    );

    const results = [];

    for (const candidate of candidates) {
      try {
        const result = await this.evaluateCandidate(candidate);
        results.push(result);
      } catch (error: any) {
        logger.error(`Error in batch evaluation for candidate:`, error);
        results.push({
          success: false,
          error: error.message,
          candidateName: candidate.candidateName,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info(
      `Batch evaluation completed: ${successCount}/${candidates.length} successful`,
    );

    return results;
  }

  /**
   * Re-evaluate an existing candidate
   */
  async reEvaluateCandidate(candidateId: string, updates?: any): Promise<any> {
    logger.info(`Re-evaluating candidate: ${candidateId}`);

    try {
      // Fetch existing candidate data
      const candidateDoc = await getCollection(COLLECTIONS.APPLICANTS)
        .doc(candidateId)
        .get();

      if (!candidateDoc.exists) {
        throw new Error("Candidate not found");
      }

      const existingData = candidateDoc.data();

      // Merge with updates if provided
      const evaluationParams = {
        userId: existingData?.userId,
        candidateName: updates?.candidateName || existingData?.candidate?.name,
        candidateEmail:
          updates?.candidateEmail || existingData?.candidate?.email,
        candidatePhone:
          updates?.candidatePhone || existingData?.candidate?.phone,
        resumeText:
          updates?.resumeText || existingData?.parsedResume?.summary || "",
        resumeUrl: updates?.resumeUrl || existingData?.candidate?.resumeUrl,
        jobId: updates?.jobId || existingData?.candidate?.jobId,
        jobTitle: updates?.jobTitle || existingData?.candidate?.jobTitle,
        jobDescription: updates?.jobDescription || "",
        requiredSkills: updates?.requiredSkills || [],
        preferredSkills: updates?.preferredSkills || [],
        requiredExperience: updates?.requiredExperience || 0,
        seniorityLevel: updates?.seniorityLevel || "mid",
        industryPreference: updates?.industryPreference,
      };

      // Run evaluation
      const evaluation = await this.evaluateCandidate(evaluationParams);

      if (evaluation.success) {
        // Update the existing document
        await updateDocument(COLLECTIONS.APPLICANTS, candidateId, {
          skillsEvaluation: evaluation.skillsEvaluation,
          experienceEvaluation: evaluation.experienceEvaluation,
          culturalFit: evaluation.culturalFit,
          finalScore: evaluation.finalScore,
          decision: evaluation.decision,
          confidence: evaluation.confidence,
          status: this.determineStatus(evaluation.decision),
          processingTime: evaluation.processingTime,
          lastEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return evaluation;
    } catch (error: any) {
      logger.error(`Error re-evaluating candidate ${candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Parse resume only (without full evaluation)
   */
  async parseResumeOnly(
    resumeText: string,
    candidateInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<any> {
    logger.info("Parsing resume without full evaluation");

    try {
      // Use a minimal job context for parsing
      const result = await this.orchestrator.evaluate({
        resumeText,
        candidateName: candidateInfo?.name,
        candidateEmail: candidateInfo?.email,
        candidatePhone: candidateInfo?.phone,
        jobTitle: "General Position",
        jobDescription: "General evaluation",
        requiredSkills: [],
        preferredSkills: [],
        requiredExperience: 0,
        seniorityLevel: "mid",
      });

      return {
        success: result.success,
        parsedResume: result.parsedResume,
        error: result.error,
      };
    } catch (error: any) {
      logger.error("Error parsing resume:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Quick skills match assessment
   */
  async quickSkillsEvaluation(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills?: string[],
  ): Promise<any> {
    logger.info("Performing quick skills evaluation");

    try {
      const matchedRequired = candidateSkills.filter((skill) =>
        requiredSkills.some(
          (req) =>
            skill.toLowerCase().includes(req.toLowerCase()) ||
            req.toLowerCase().includes(skill.toLowerCase()),
        ),
      );

      const missingRequired = requiredSkills.filter(
        (req) =>
          !candidateSkills.some(
            (skill) =>
              skill.toLowerCase().includes(req.toLowerCase()) ||
              req.toLowerCase().includes(skill.toLowerCase()),
          ),
      );

      const matchedPreferred = preferredSkills
        ? candidateSkills.filter((skill) =>
            preferredSkills.some(
              (pref) =>
                skill.toLowerCase().includes(pref.toLowerCase()) ||
                pref.toLowerCase().includes(skill.toLowerCase()),
            ),
          )
        : [];

      const requiredMatchPercentage =
        requiredSkills.length > 0
          ? Math.round((matchedRequired.length / requiredSkills.length) * 100)
          : 0;

      const overallScore = Math.min(
        requiredMatchPercentage + matchedPreferred.length * 2,
        100,
      );

      return {
        success: true,
        overallScore,
        matchedRequiredSkills: matchedRequired,
        missingRequiredSkills: missingRequired,
        matchedPreferredSkills: matchedPreferred,
        requiredMatchPercentage,
        recommendation: this.getSkillsRecommendation(
          overallScore,
          missingRequired,
        ),
      };
    } catch (error: any) {
      logger.error("Error in quick skills evaluation:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get agents information
   */
  getAgentsInfo(): any {
    const workflowInfo = this.orchestrator.getWorkflowInfo();

    return {
      orchestrator: "LangGraph Multi-Agent System",
      version: workflowInfo.version,
      nodes: workflowInfo.nodes,
      weights: workflowInfo.weights,
      description:
        "Advanced AI-powered candidate evaluation using LangGraph workflow orchestration",
      features: [
        "Resume parsing with NLP",
        "Technical skills assessment",
        "Experience and career progression analysis",
        "Cultural fit evaluation",
        "Weighted scoring with confidence levels",
        "Interview question suggestions",
        "Actionable recommendations",
      ],
    };
  }

  /**
   * Get evaluation statistics for a user
   */
  async getEvaluationStats(userId: string): Promise<any> {
    try {
      const snapshot = await getCollection(COLLECTIONS.APPLICANTS)
        .where("userId", "==", userId)
        .get();

      const evaluations = snapshot.docs.map((doc) => doc.data());

      const stats = {
        total: evaluations.length,
        byDecision: {
          strong_yes: evaluations.filter(
            (e: any) => e.decision === "strong_yes",
          ).length,
          yes: evaluations.filter((e: any) => e.decision === "yes").length,
          maybe: evaluations.filter((e: any) => e.decision === "maybe").length,
          no: evaluations.filter((e: any) => e.decision === "no").length,
          strong_no: evaluations.filter((e: any) => e.decision === "strong_no")
            .length,
        },
        byStatus: {
          accepted: evaluations.filter((e: any) => e.status === "accepted")
            .length,
          rejected: evaluations.filter((e: any) => e.status === "rejected")
            .length,
        },
        averageScores: {
          final: this.calculateAverage(
            evaluations.map((e: any) => e.finalScore),
          ),
          skills: this.calculateAverage(
            evaluations.map((e: any) => e.skillsEvaluation?.overallScore),
          ),
          experience: this.calculateAverage(
            evaluations.map((e: any) => e.experienceEvaluation?.overallScore),
          ),
          culturalFit: this.calculateAverage(
            evaluations.map((e: any) => e.culturalFit?.overallScore),
          ),
        },
        averageProcessingTime: this.calculateAverage(
          evaluations.map((e: any) => e.processingTime),
        ),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      logger.error(`Error getting evaluation stats for user ${userId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Determine candidate status based on decision
   */
  private determineStatus(decision: string): string {
    const statusMap: Record<string, string> = {
      strong_yes: "accepted",
      yes: "accepted",
      maybe: "accepted",
      no: "rejected",
      strong_no: "rejected",
    };

    return statusMap[decision] || "rejected";
  }

  /**
   * Get skills recommendation based on score
   */
  private getSkillsRecommendation(
    score: number,
    missingSkills: string[],
  ): string {
    if (score >= 90) {
      return "Excellent skills match! Highly recommended for interview.";
    } else if (score >= 75) {
      return "Strong skills match. Good candidate for consideration.";
    } else if (score >= 60) {
      return `Moderate skills match. Missing: ${missingSkills.slice(0, 3).join(", ")}. Consider if other factors are strong.`;
    } else if (score >= 40) {
      return `Weak skills match. Missing critical skills: ${missingSkills.slice(0, 3).join(", ")}. May need training.`;
    } else {
      return `Poor skills match. Missing most required skills. Not recommended unless exceptional in other areas.`;
    }
  }

  /**
   * Calculate average of numeric array
   */
  private calculateAverage(values: number[]): number {
    const validValues = values.filter(
      (v) => typeof v === "number" && !isNaN(v),
    );
    if (validValues.length === 0) return 0;
    return Math.round(
      validValues.reduce((sum, v) => sum + v, 0) / validValues.length,
    );
  }
}

export default EnhancedEvaluationService;
