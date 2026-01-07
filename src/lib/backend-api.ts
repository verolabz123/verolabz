/**
 * Backend API Integration
 * Connects frontend to the AI-powered candidate evaluation backend
 */

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const API_BASE = `${BACKEND_URL}/api/v1`;

export interface CandidateEvaluationRequest {
  userId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeText?: string;
  resumeUrl: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  requiredExperience: number;
  seniorityLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  industryPreference?: string;
}

export interface EvaluationResponse {
  success: boolean;
  data?: {
    candidateId: string;
    finalScore: number;
    decision: "shortlisted" | "rejected" | "review";
    confidence: number;
    componentScores: {
      skills: number;
      experience: number;
      education: number;
      overall: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    interviewSuggestions: string[];
    detailedReasoning: string;
    parsedResume: {
      name: string;
      email: string;
      phone: string;
      skills: string[];
      totalExperienceYears: number;
      education: Array<{
        degree: string;
        institution: string;
        year: string;
        field?: string;
      }>;
      certifications: string[];
    };
    skillsEvaluation: {
      overallScore: number;
      matchedSkills: Array<{
        skill: string;
        proficiencyLevel: string;
        relevanceScore: number;
      }>;
      missingCriticalSkills: string[];
      strengthAreas: string[];
      weaknessAreas: string[];
    };
    experienceEvaluation: {
      overallScore: number;
      yearsMatchScore: number;
      relevanceScore: number;
      progressionScore: number;
      leadershipScore: number;
      careerProgression: string;
      isSeniorityMatch: boolean;
    };
    processingTime: number;
  };
  error?: string;
  timestamp: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    field?: string;
  }>;
  certifications: string[];
  languages: string[];
  totalExperienceYears: number;
  keyHighlights: string[];
}

export interface QuickSkillsMatchRequest {
  candidateSkills: string[];
  requiredSkills: string[];
  preferredSkills?: string[];
}

export interface QuickSkillsMatchResponse {
  success: boolean;
  data?: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
  };
  error?: string;
}

export interface BatchEvaluationRequest {
  candidates: CandidateEvaluationRequest[];
}

export interface BatchEvaluationResponse {
  success: boolean;
  data?: {
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      candidateId: string;
      success: boolean;
      finalScore: number;
      decision: string;
      confidence: number;
      error?: string;
    }>;
  };
  error?: string;
}

/**
 * Check backend health status
 */
export async function checkBackendHealth(): Promise<{
  healthy: boolean;
  message: string;
  services?: Record<string, any>;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        healthy: false,
        message: `Backend returned status ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      healthy: data.status === "healthy",
      message:
        data.status === "healthy" ? "Backend is online" : "Backend is degraded",
      services: data.services,
    };
  } catch (error) {
    console.error("Backend health check failed:", error);
    return {
      healthy: false,
      message: error instanceof Error ? error.message : "Backend is offline",
    };
  }
}

/**
 * Evaluate a single candidate using AI agents
 */
export async function evaluateCandidate(
  request: CandidateEvaluationRequest,
  onProgress?: (progress: number) => void,
): Promise<EvaluationResponse> {
  try {
    onProgress?.(10);

    console.log(
      "Sending candidate to backend for evaluation:",
      request.candidateEmail,
    );

    const response = await fetch(`${API_BASE}/evaluation/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    onProgress?.(50);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Backend returned status ${response.status}`,
      );
    }

    const result: EvaluationResponse = await response.json();

    onProgress?.(100);

    console.log("Evaluation completed:", {
      candidateId: result.data?.candidateId,
      score: result.data?.finalScore,
      decision: result.data?.decision,
    });

    return result;
  } catch (error) {
    console.error("Candidate evaluation failed:", error);
    onProgress?.(0);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to evaluate candidate",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Parse resume without evaluation
 */
export async function parseResumeOnly(
  resumeText: string,
  candidateInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  },
): Promise<{ success: boolean; data?: ParsedResume; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/evaluation/parse-resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resumeText,
        candidateName: candidateInfo?.name,
        candidateEmail: candidateInfo?.email,
        candidatePhone: candidateInfo?.phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to parse resume");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Resume parsing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse resume",
    };
  }
}

/**
 * Quick skills match (fast, no full evaluation)
 */
export async function quickSkillsMatch(
  request: QuickSkillsMatchRequest,
): Promise<QuickSkillsMatchResponse> {
  try {
    const response = await fetch(`${API_BASE}/evaluation/quick-skills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Skills match failed");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Quick skills match failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to match skills",
    };
  }
}

/**
 * Batch evaluate multiple candidates
 */
export async function batchEvaluateCandidates(
  request: BatchEvaluationRequest,
  onProgress?: (progress: number) => void,
): Promise<BatchEvaluationResponse> {
  try {
    onProgress?.(10);

    console.log(
      `Starting batch evaluation for ${request.candidates.length} candidates`,
    );

    const response = await fetch(`${API_BASE}/evaluation/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    onProgress?.(80);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Batch evaluation failed");
    }

    const result: BatchEvaluationResponse = await response.json();

    onProgress?.(100);

    console.log("Batch evaluation completed:", {
      total: result.data?.total,
      successful: result.data?.successful,
      failed: result.data?.failed,
      hasData: !!result.data,
      resultKeys: Object.keys(result),
    });

    // Log individual results for debugging
    if (result.data?.results) {
      console.log(
        "Individual results:",
        result.data.results.map((r) => ({
          candidateId: r.candidateId,
          success: r.success,
          score: r.finalScore,
          error: r.error,
        })),
      );
    } else {
      console.warn("No results array in response data");
    }

    return result;
  } catch (error) {
    console.error("Batch evaluation failed:", error);
    onProgress?.(0);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to evaluate candidates",
    };
  }
}

/**
 * Get all candidates for a user
 */
export async function getCandidates(userId: string) {
  try {
    const response = await fetch(`${API_BASE}/candidates/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch candidates: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get candidates:", error);
    throw error;
  }
}

/**
 * Get candidates for a specific job
 */
export async function getJobCandidates(userId: string, jobId: string) {
  try {
    const response = await fetch(`${API_BASE}/candidates/${userId}/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job candidates: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get job candidates:", error);
    throw error;
  }
}

/**
 * Get candidate statistics
 */
export async function getCandidateStats(userId: string) {
  try {
    const response = await fetch(`${API_BASE}/candidates/${userId}/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get candidate stats:", error);
    throw error;
  }
}

/**
 * Delete a candidate
 */
export async function deleteCandidate(userId: string, candidateId: string) {
  try {
    const response = await fetch(
      `${API_BASE}/candidates/${userId}/${candidateId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete candidate: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to delete candidate:", error);
    throw error;
  }
}

/**
 * Helper: Process Excel data and send to backend for evaluation
 */
export async function processExcelWithBackend(
  candidates: Array<{
    name: string;
    email: string;
    phone: string;
    jobId: string;
    resume_url: string;
    resume_text?: string;
  }>,
  userId: string,
  jobConfig: {
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    preferredSkills?: string[];
    requiredExperience: number;
    seniorityLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  },
  onProgress?: (progress: number) => void,
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}> {
  try {
    onProgress?.(5);

    // Convert Excel rows to evaluation requests
    const evaluationRequests: CandidateEvaluationRequest[] = candidates.map(
      (candidate) => ({
        userId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        candidatePhone: candidate.phone,
        resumeUrl: candidate.resume_url,
        resumeText: candidate.resume_text, // Include resume text if available
        jobId: candidate.jobId,
        jobTitle: jobConfig.jobTitle,
        jobDescription: jobConfig.jobDescription,
        requiredSkills: jobConfig.requiredSkills,
        preferredSkills: jobConfig.preferredSkills,
        requiredExperience: jobConfig.requiredExperience,
        seniorityLevel: jobConfig.seniorityLevel,
      }),
    );

    onProgress?.(10);

    // Send batch evaluation request
    const result = await batchEvaluateCandidates(
      { candidates: evaluationRequests },
      (batchProgress) => {
        // Map batch progress to overall progress (10% to 100%)
        const overallProgress = 10 + batchProgress * 0.9;
        onProgress?.(overallProgress);
      },
    );

    if (!result.success || !result.data) {
      console.error("Batch evaluation failed:", {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        fullResult: result,
      });
      throw new Error(result.error || "Batch evaluation failed");
    }

    console.log("Excel processing successful:", {
      processed: result.data.successful,
      failed: result.data.failed,
      total: result.data.total,
    });

    return {
      success: true,
      processed: result.data.successful,
      failed: result.data.failed,
      errors: result.data.results
        .filter((r) => !r.success)
        .map((r) => `${r.candidateId}: ${r.error || "Unknown error"}`),
    };
  } catch (error) {
    console.error("Excel processing with backend failed:", error);
    return {
      success: false,
      processed: 0,
      failed: candidates.length,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Get backend configuration
 */
export function getBackendConfig() {
  return {
    url: BACKEND_URL,
    apiBase: API_BASE,
    isLocal:
      BACKEND_URL.includes("localhost") || BACKEND_URL.includes("127.0.0.1"),
  };
}

export default {
  checkBackendHealth,
  evaluateCandidate,
  parseResumeOnly,
  quickSkillsMatch,
  batchEvaluateCandidates,
  getCandidates,
  getJobCandidates,
  getCandidateStats,
  deleteCandidate,
  processExcelWithBackend,
  getBackendConfig,
};
