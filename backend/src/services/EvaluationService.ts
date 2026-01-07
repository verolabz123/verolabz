import axios from "axios";
import Groq from "groq-sdk";
import { logger } from "../utils/logger.js";
import { getDB } from "../config/firebase.js";

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  certifications: string[];
  totalExperienceYears: number;
}

interface SkillsEvaluation {
  overallScore: number;
  matchedSkills: Array<{ skill: string; proficiency: string }>;
  missingCriticalSkills: string[];
  additionalSkills: string[];
  strengthAreas: string[];
  weaknessAreas: string[];
  reasoning: string;
}

interface ExperienceEvaluation {
  overallScore: number;
  yearsMatchScore: number;
  relevanceScore: number;
  progressionScore: number;
  leadershipScore: number;
  careerProgression: string;
  relevantRoles: string[];
  isSeniorityMatch: boolean;
  reasoning: string;
}

interface CulturalFitEvaluation {
  overallScore: number;
  communicationStyle: string;
  workStyle: string;
  teamAlignment: string;
  industryFit: string;
  reasoning: string;
}

interface FinalScoring {
  finalScore: number;
  decision: "strong_accept" | "accept" | "maybe" | "reject";
  confidence: number;
  componentScores: {
    skills: number;
    experience: number;
    culturalFit: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  interviewSuggestions: string[];
  detailedReasoning: string;
}

interface EvaluationRequest {
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

interface EvaluationResult {
  success: boolean;
  candidateId?: string;
  finalScore: number;
  decision: string;
  confidence: number;
  parsedResume: ParsedResume;
  skillsEvaluation: SkillsEvaluation;
  experienceEvaluation: ExperienceEvaluation;
  culturalFitEvaluation?: CulturalFitEvaluation;
  finalScoring: FinalScoring;
  processingTime: number;
  error?: string;
}

class EvaluationService {
  private model: string;
  private batchModel: string;

  constructor() {
    this.model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    // Use faster, smaller model for batch processing to avoid rate limits
    this.batchModel = process.env.GROQ_BATCH_MODEL || "llama-3.1-8b-instant";
  }

  /**
   * Evaluate a single candidate
   */
  async evaluateCandidate(
    request: EvaluationRequest,
  ): Promise<EvaluationResult> {
    const startTime = Date.now();

    try {
      logger.info(
        `Starting evaluation for candidate: ${request.candidateName}`,
      );

      // Step 1: Get resume text (PRIORITY: resume_text > resume_url)
      let resumeText = request.resumeText?.trim();

      if (resumeText && resumeText.length >= 50) {
        logger.info(
          `Using provided resume_text for ${request.candidateName} (${resumeText.length} chars)`,
        );
      } else if (request.resumeUrl) {
        logger.info(
          `Attempting to download resume from URL for ${request.candidateName}`,
        );
        try {
          resumeText = await this.downloadResumeText(request.resumeUrl);
          logger.info(
            `Successfully downloaded resume (${resumeText.length} chars)`,
          );
        } catch (error: any) {
          // If download fails, create a minimal resume from available data
          logger.error(
            `❌ Failed to download resume from URL for ${request.candidateName}`,
          );
          logger.error(`URL: ${request.resumeUrl}`);
          logger.error(`Error: ${error.message}`);
          logger.warn(
            `💡 TIP: For Google Drive/Dropbox/OneDrive links, please copy-paste the resume TEXT directly into the 'resume_text' column instead of using URL`,
          );
          logger.warn(`Creating minimal resume from available data...`);

          // Generate a minimal resume from known information
          resumeText = this.generateMinimalResume(request);
        }
      } else {
        logger.warn(
          `No resume_text or resume_url provided for ${request.candidateName}`,
        );
        resumeText = this.generateMinimalResume(request);
      }

      if (!resumeText || resumeText.trim().length < 50) {
        // Last resort: create minimal resume from candidate data
        logger.warn(
          `Resume text too short for ${request.candidateName} (${resumeText?.length || 0} chars), generating from available data`,
        );
        resumeText = this.generateMinimalResume(request);
      }

      // Step 2: Parse resume
      const parsedResume = await this.parseResume(resumeText, {
        name: request.candidateName,
        email: request.candidateEmail,
        phone: request.candidatePhone,
      });

      // Step 3: Evaluate skills
      const skillsEvaluation = await this.evaluateSkills(
        parsedResume,
        request.requiredSkills,
        request.preferredSkills || [],
        request.jobDescription,
      );

      // Step 4: Evaluate experience
      const experienceEvaluation = await this.evaluateExperience(
        parsedResume,
        request.requiredExperience,
        request.seniorityLevel,
        request.jobDescription,
      );

      // Step 5: Evaluate cultural fit (optional)
      let culturalFitEvaluation: CulturalFitEvaluation | undefined;
      if (request.industryPreference) {
        culturalFitEvaluation = await this.evaluateCulturalFit(
          parsedResume,
          request.industryPreference,
          request.jobDescription,
        );
      }

      // Step 6: Final scoring
      const finalScoring = await this.calculateFinalScore(
        skillsEvaluation,
        experienceEvaluation,
        culturalFitEvaluation,
      );

      // Step 7: Save to Firestore
      const candidateId = await this.saveEvaluationResult(
        request.userId,
        request.jobId,
        {
          candidateName: request.candidateName,
          candidateEmail: request.candidateEmail,
          candidatePhone: request.candidatePhone,
          resumeUrl: request.resumeUrl,
          parsedResume,
          skillsEvaluation,
          experienceEvaluation,
          culturalFitEvaluation,
          finalScoring,
          jobTitle: request.jobTitle,
        },
      );

      const processingTime = Date.now() - startTime;

      logger.info(
        `Evaluation completed for ${request.candidateName}. Score: ${finalScoring.finalScore}, Decision: ${finalScoring.decision}, Time: ${processingTime}ms`,
      );

      return {
        success: true,
        candidateId,
        finalScore: finalScoring.finalScore,
        decision: finalScoring.decision,
        confidence: finalScoring.confidence,
        parsedResume,
        skillsEvaluation,
        experienceEvaluation,
        culturalFitEvaluation,
        finalScoring,
        processingTime,
      };
    } catch (error: any) {
      logger.error(`Evaluation failed for ${request.candidateName}:`, {
        message: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        finalScore: 0,
        decision: "reject",
        confidence: 0,
        parsedResume: {
          name: request.candidateName,
          email: request.candidateEmail,
          phone: request.candidatePhone,
          skills: [],
          experience: [],
          education: [],
          certifications: [],
          totalExperienceYears: 0,
        },
        skillsEvaluation: {
          overallScore: 0,
          matchedSkills: [],
          missingCriticalSkills: [],
          additionalSkills: [],
          strengthAreas: [],
          weaknessAreas: [],
          reasoning: "",
        },
        experienceEvaluation: {
          overallScore: 0,
          yearsMatchScore: 0,
          relevanceScore: 0,
          progressionScore: 0,
          leadershipScore: 0,
          careerProgression: "",
          relevantRoles: [],
          isSeniorityMatch: false,
          reasoning: "",
        },
        finalScoring: {
          finalScore: 0,
          decision: "reject",
          confidence: 0,
          componentScores: { skills: 0, experience: 0, culturalFit: 0 },
          strengths: [],
          weaknesses: [],
          recommendations: [],
          interviewSuggestions: [],
          detailedReasoning: "",
        },
        processingTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Evaluate multiple candidates in batch
   */
  async evaluateCandidates(
    candidates: EvaluationRequest[],
  ): Promise<EvaluationResult[]> {
    logger.info(
      `Starting batch evaluation for ${candidates.length} candidates using ${this.batchModel}`,
    );

    const results: EvaluationResult[] = [];

    // Temporarily switch to batch model
    const originalModel = this.model;
    this.model = this.batchModel;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      try {
        logger.info(
          `Processing candidate ${i + 1}/${candidates.length}: ${candidate.candidateName}`,
        );

        const result = await this.evaluateCandidate(candidate);
        results.push(result);

        // Add delay between requests to avoid rate limits (only if not last candidate)
        if (i < candidates.length - 1) {
          const delay = 2000; // 2 second delay between candidates
          logger.info(`Waiting ${delay}ms before next evaluation...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error: any) {
        logger.error(`Batch evaluation error for ${candidate.candidateName}:`, {
          message: error.message,
        });

        results.push({
          success: false,
          finalScore: 0,
          decision: "reject",
          confidence: 0,
          parsedResume: {
            name: candidate.candidateName,
            email: candidate.candidateEmail,
            phone: candidate.candidatePhone,
            skills: [],
            experience: [],
            education: [],
            certifications: [],
            totalExperienceYears: 0,
          },
          skillsEvaluation: {
            overallScore: 0,
            matchedSkills: [],
            missingCriticalSkills: [],
            additionalSkills: [],
            strengthAreas: [],
            weaknessAreas: [],
            reasoning: "",
          },
          experienceEvaluation: {
            overallScore: 0,
            yearsMatchScore: 0,
            relevanceScore: 0,
            progressionScore: 0,
            leadershipScore: 0,
            careerProgression: "",
            relevantRoles: [],
            isSeniorityMatch: false,
            reasoning: "",
          },
          finalScoring: {
            finalScore: 0,
            decision: "reject",
            confidence: 0,
            componentScores: { skills: 0, experience: 0, culturalFit: 0 },
            strengths: [],
            weaknesses: [],
            recommendations: [],
            interviewSuggestions: [],
            detailedReasoning: "",
          },
          processingTime: 0,
          error: error.message,
        });
      }
    }

    // Restore original model
    this.model = originalModel;

    logger.info(
      `Batch evaluation completed. ${results.filter((r) => r.success).length}/${results.length} successful`,
    );

    return results;
  }

  /**
   * Parse resume only (without evaluation)
   */
  async parseResumeOnly(
    resumeText: string,
    knownData?: { name?: string; email?: string; phone?: string },
  ): Promise<ParsedResume> {
    return await this.parseResume(resumeText, knownData);
  }

  /**
   * Quick skills evaluation without full candidate evaluation
   */
  async quickSkillsEvaluation(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills?: string[],
  ): Promise<any> {
    const prompt = `Evaluate the candidate's skills match:

Candidate Skills: ${candidateSkills.join(", ")}
Required Skills: ${requiredSkills.join(", ")}
Preferred Skills: ${preferredSkills?.join(", ") || "None"}

Provide a JSON response with:
{
  "overallScore": <number 0-100>,
  "matchedRequired": [<list of matched required skills>],
  "matchedPreferred": [<list of matched preferred skills>],
  "missingRequired": [<list of missing required skills>],
  "missingPreferred": [<list of missing preferred skills>],
  "additionalSkills": [<list of additional relevant skills>],
  "reasoning": "<brief explanation>"
}`;

    const response = await getGroqClient().chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return this.parseJSONResponse(content);
  }

  /**
   * Get information about the evaluation agents/system
   */
  getAgentsInfo() {
    return [
      {
        name: "Resume Parser",
        description: "Extracts structured information from resume text",
        capabilities: [
          "Parse contact info",
          "Extract skills",
          "Parse experience",
          "Parse education",
        ],
      },
      {
        name: "Skills Evaluator",
        description: "Evaluates candidate skills against job requirements",
        capabilities: [
          "Match required skills",
          "Assess proficiency",
          "Identify gaps",
          "Find strengths",
        ],
      },
      {
        name: "Experience Evaluator",
        description: "Evaluates work experience and career progression",
        capabilities: [
          "Assess years of experience",
          "Evaluate relevance",
          "Check seniority match",
          "Career progression",
        ],
      },
      {
        name: "Cultural Fit Analyzer",
        description: "Analyzes cultural and industry fit",
        capabilities: [
          "Industry alignment",
          "Work style assessment",
          "Team fit evaluation",
        ],
      },
      {
        name: "Final Scorer",
        description: "Generates final hiring decision with detailed reasoning",
        capabilities: [
          "Aggregate scores",
          "Generate decision",
          "Provide recommendations",
          "Interview suggestions",
        ],
      },
    ];
  }

  // ============== Private Methods ==============

  /**
   * Download resume text from URL
   */
  private async downloadResumeText(url: string): Promise<string> {
    try {
      const timeout = parseInt(
        process.env.RESUME_DOWNLOAD_TIMEOUT || "30000",
        10,
      );
      const maxSize = parseInt(process.env.MAX_RESUME_SIZE || "5242880", 10);

      // First, try to download as arraybuffer to detect binary content
      const response = await axios.get(url, {
        timeout,
        maxContentLength: maxSize,
        responseType: "arraybuffer",
      });

      if (!response.data) {
        throw new Error("No data received from resume URL");
      }

      // Convert buffer to string
      const buffer = Buffer.from(response.data);
      let text = buffer.toString("utf8");

      // Check if content is binary/PDF (starts with %PDF or contains lots of null bytes)
      const nullByteCount = (text.match(/\0/g) || []).length;
      const isPDF = text.startsWith("%PDF") || nullByteCount > 10;

      if (isPDF) {
        logger.warn(
          "Resume URL returned binary PDF content. Using PDF parser...",
        );

        // Try to parse PDF using pdf-parse first
        try {
          const { parseResumePDF } = await import("../utils/resumeParser.js");
          text = await parseResumePDF(buffer);

          if (text && text.length > 50) {
            logger.info(
              `Successfully parsed PDF content: ${text.length} characters`,
            );
            return text;
          }

          logger.warn("PDF parsed but text too short, trying OCR...");
        } catch (pdfError: any) {
          logger.warn(
            `PDF parsing failed: ${pdfError.message}, trying OCR fallback...`,
          );
        }

        // Fallback to OCR service if pdf-parse fails or returns minimal text
        try {
          const { getOCRService } = await import("./OCRService.js");
          const ocrService = getOCRService();
          await ocrService.initialize();

          logger.info("Using OCR service to extract PDF text...");
          text = await ocrService.processDocument(buffer);

          if (text && text.length > 50) {
            logger.info(
              `Successfully extracted text via OCR: ${text.length} characters`,
            );
            return text;
          }
        } catch (ocrError: any) {
          logger.error(`OCR fallback also failed: ${ocrError.message}`);
        }

        // If both methods fail, throw error to trigger placeholder generation
        throw new Error(
          "Resume is in PDF format but could not be parsed using either pdf-parse or OCR. Please provide resume text directly or use a text-based format.",
        );
      }

      // Return text content
      return text;
    } catch (error: any) {
      const errorMsg = error.message || "Failed to download resume";
      const errorCode = error.code || "UNKNOWN";
      const statusCode = error.response?.status;

      logger.error(`Failed to download resume from ${url}:`, {
        message: errorMsg,
        code: errorCode,
        status: statusCode,
      });

      // Add helpful message for common cloud storage URLs
      if (
        url.includes("drive.google.com") ||
        url.includes("dropbox.com") ||
        url.includes("onedrive.live.com") ||
        url.includes("sharepoint.com")
      ) {
        logger.error(
          `⚠️  CLOUD STORAGE DETECTED: This appears to be a Google Drive/Dropbox/OneDrive link.`,
        );
        logger.error(
          `   These services require authentication and cannot be directly downloaded.`,
        );
        logger.error(
          `   SOLUTION: Copy the resume text and paste it into the 'resume_text' column in your Excel file.`,
        );
      }

      // Provide more specific error messages
      if (statusCode === 404) {
        throw new Error(
          `Resume not found at URL (404). Please ensure the resume URL is correct and accessible.`,
        );
      } else if (statusCode === 403) {
        throw new Error(
          `Access denied to resume URL (403). Please check permissions.`,
        );
      } else if (errorCode === "ECONNREFUSED" || errorCode === "ENOTFOUND") {
        throw new Error(
          `Cannot connect to resume URL. Please check the URL is valid.`,
        );
      } else {
        throw new Error(`Failed to download resume: ${errorMsg}`);
      }
    }
  }

  /**
   * Generate minimal resume text from candidate information
   */
  private generateMinimalResume(request: EvaluationRequest): string {
    return `
${request.candidateName}
${request.candidateEmail}
${request.candidatePhone || ""}

PROFESSIONAL PROFILE
Candidate applying for ${request.jobTitle} position.

CONTACT INFORMATION
Email: ${request.candidateEmail}
Phone: ${request.candidatePhone || "Not provided"}

SKILLS
Skills evaluation will be conducted during interview process.

JOB APPLICATION
Position: ${request.jobTitle}
Job ID: ${request.jobId}

Note: Full resume not available at provided URL (${request.resumeUrl}).
Candidate may provide updated resume during interview process.
`.trim();
  }

  /**
   * Parse resume using LLM
   */
  private async parseResume(
    resumeText: string,
    knownData?: { name?: string; email?: string; phone?: string },
  ): Promise<ParsedResume> {
    // Truncate resume text to avoid token limits (approx 2000 tokens = 8000 chars)
    const maxResumeChars = 8000;
    const truncatedResumeText =
      resumeText.length > maxResumeChars
        ? resumeText.substring(0, maxResumeChars) +
          "\n\n[Resume truncated due to length]"
        : resumeText;

    const prompt = `Parse the following resume and extract structured information. Return valid JSON only.

Resume Text:
${truncatedResumeText}

${knownData ? `Known Information:\nName: ${knownData.name || "Unknown"}\nEmail: ${knownData.email || "Unknown"}\nPhone: ${knownData.phone || "Unknown"}\n` : ""}

Extract and return a JSON object with this exact structure:
{
  "name": "<full name>",
  "email": "<email address>",
  "phone": "<phone number or null>",
  "summary": "<professional summary or null>",
  "skills": [<array of technical and professional skills>],
  "experience": [
    {
      "title": "<job title>",
      "company": "<company name>",
      "duration": "<duration string>",
      "description": "<brief description>"
    }
  ],
  "education": [
    {
      "degree": "<degree name>",
      "institution": "<institution name>",
      "year": "<graduation year or null>"
    }
  ],
  "certifications": [<array of certifications>],
  "totalExperienceYears": <estimated total years of experience as number>
}

Return ONLY the JSON object, no additional text.`;

    const response = await getGroqClient().chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = this.parseJSONResponse(content);

    // Merge with known data
    return {
      name: knownData?.name || parsed.name || "Unknown",
      email: knownData?.email || parsed.email || "Unknown",
      phone: knownData?.phone || parsed.phone,
      summary: parsed.summary,
      skills: parsed.skills || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      certifications: parsed.certifications || [],
      totalExperienceYears: parsed.totalExperienceYears || 0,
    };
  }

  /**
   * Evaluate candidate skills
   */
  private async evaluateSkills(
    parsedResume: ParsedResume,
    requiredSkills: string[],
    preferredSkills: string[],
    jobDescription: string,
  ): Promise<SkillsEvaluation> {
    // Truncate job description if too long
    const maxJobDescChars = 500;
    const truncatedJobDesc =
      jobDescription.length > maxJobDescChars
        ? jobDescription.substring(0, maxJobDescChars) + "..."
        : jobDescription;

    const prompt = `Evaluate the candidate's skills for this position.

Job Description:
${truncatedJobDesc}

Required Skills: ${requiredSkills.join(", ")}
Preferred Skills: ${preferredSkills.join(", ")}

Candidate Skills: ${parsedResume.skills.join(", ")}

Provide a JSON response with:
{
  "overallScore": <number 0-100>,
  "matchedSkills": [{"skill": "<name>", "proficiency": "<estimated level>"}],
  "missingCriticalSkills": [<list of missing required skills>],
  "additionalSkills": [<list of additional relevant skills>],
  "strengthAreas": [<list of strength areas>],
  "weaknessAreas": [<list of weakness areas>],
  "reasoning": "<detailed explanation>"
}

Return ONLY valid JSON.`;

    const response = await getGroqClient().chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return this.parseJSONResponse(content);
  }

  /**
   * Evaluate candidate experience
   */
  private async evaluateExperience(
    parsedResume: ParsedResume,
    requiredExperience: number,
    seniorityLevel: string,
    jobDescription: string,
  ): Promise<ExperienceEvaluation> {
    // Truncate experience descriptions to avoid token limits
    const experienceText = parsedResume.experience
      .slice(0, 5) // Limit to 5 most recent positions
      .map(
        (exp) =>
          `${exp.title} at ${exp.company} (${exp.duration}): ${exp.description.substring(0, 200)}`,
      )
      .join("\n");

    // Truncate job description
    const maxJobDescChars = 500;
    const truncatedJobDesc =
      jobDescription.length > maxJobDescChars
        ? jobDescription.substring(0, maxJobDescChars) + "..."
        : jobDescription;

    const prompt = `Evaluate the candidate's work experience for this position.

Job Description:
${truncatedJobDesc}

Required Experience: ${requiredExperience} years
Required Seniority Level: ${seniorityLevel}

Candidate Experience (${parsedResume.totalExperienceYears} years total):
${experienceText}

Provide a JSON response with:
{
  "overallScore": <number 0-100>,
  "yearsMatchScore": <number 0-100 based on years requirement>,
  "relevanceScore": <number 0-100 based on job relevance>,
  "progressionScore": <number 0-100 based on career progression>,
  "leadershipScore": <number 0-100 based on leadership indicators>,
  "careerProgression": "<description of career path>",
  "relevantRoles": [<list of most relevant past roles>],
  "isSeniorityMatch": <boolean>,
  "reasoning": "<detailed explanation>"
}

Return ONLY valid JSON.`;

    const response = await getGroqClient().chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return this.parseJSONResponse(content);
  }

  /**
   * Evaluate cultural fit
   */
  private async evaluateCulturalFit(
    parsedResume: ParsedResume,
    industryPreference: string,
    jobDescription: string,
  ): Promise<CulturalFitEvaluation> {
    // Truncate job description
    const maxJobDescChars = 500;
    const truncatedJobDesc =
      jobDescription.length > maxJobDescChars
        ? jobDescription.substring(0, maxJobDescChars) + "..."
        : jobDescription;

    const prompt = `Evaluate the candidate's cultural and industry fit.

Job Description:
${truncatedJobDesc}

Industry Preference: ${industryPreference}

Candidate Background:
- Experience: ${parsedResume.experience
      .slice(0, 3)
      .map((e) => `${e.title} at ${e.company}`)
      .join(", ")}
- Summary: ${parsedResume.summary || "Not provided"}

Provide a JSON response with:
{
  "overallScore": <number 0-100>,
  "communicationStyle": "<assessment>",
  "workStyle": "<assessment>",
  "teamAlignment": "<assessment>",
  "industryFit": "<assessment>",
  "reasoning": "<detailed explanation>"
}

Return ONLY valid JSON.`;

    const response = await getGroqClient().chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return this.parseJSONResponse(content);
  }

  /**
   * Calculate final score and make hiring decision
   */
  private async calculateFinalScore(
    skillsEvaluation: SkillsEvaluation,
    experienceEvaluation: ExperienceEvaluation,
    culturalFitEvaluation?: CulturalFitEvaluation,
    jobDescription?: string,
  ): Promise<FinalScoring> {
    const weights = {
      skills: 0.45,
      experience: 0.4,
      culturalFit: 0.15,
    };

    const componentScores = {
      skills: skillsEvaluation.overallScore,
      experience: experienceEvaluation.overallScore,
      culturalFit: culturalFitEvaluation?.overallScore || 70, // Default neutral score
    };

    const finalScore =
      componentScores.skills * weights.skills +
      componentScores.experience * weights.experience +
      componentScores.culturalFit * weights.culturalFit;

    const prompt = `Based on the evaluation results, provide a final hiring decision.

Component Scores:
- Skills: ${componentScores.skills}/100
- Experience: ${componentScores.experience}/100
- Cultural Fit: ${componentScores.culturalFit}/100

Final Weighted Score: ${finalScore.toFixed(1)}/100

Skills Evaluation: ${skillsEvaluation.reasoning.substring(0, 300)}
Experience Evaluation: ${experienceEvaluation.reasoning.substring(0, 300)}
${culturalFitEvaluation ? `Cultural Fit: ${culturalFitEvaluation.reasoning.substring(0, 200)}` : ""}

Provide a JSON response with:
{
  "decision": "<one of: strong_accept, accept, maybe, reject>",
  "confidence": <number 0-100>,
  "strengths": [<list of top 3-5 strengths>],
  "weaknesses": [<list of top 3-5 concerns>],
  "recommendations": [<list of hiring recommendations>],
  "interviewSuggestions": [<list of suggested interview questions/topics>],
  "detailedReasoning": "<comprehensive explanation of decision>"
}

Decision Guidelines:
- strong_accept: 85-100, excellent fit
- accept: 70-84, good fit
- maybe: 55-69, potential with concerns
- reject: 0-54, not a fit

Return ONLY valid JSON.`;

    const response = await getGroqClient().chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = this.parseJSONResponse(content);

    return {
      finalScore: Math.round(finalScore),
      decision: result.decision || "reject",
      confidence: result.confidence || 50,
      componentScores,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendations: result.recommendations || [],
      interviewSuggestions: result.interviewSuggestions || [],
      detailedReasoning: result.detailedReasoning || "",
    };
  }

  /**
   * Save evaluation result to Firestore
   */
  private async saveEvaluationResult(
    userId: string,
    jobId: string,
    evaluationData: any,
  ): Promise<string> {
    try {
      logger.info(
        `Saving evaluation for ${evaluationData.candidateName} to Firebase...`,
      );

      // Save to candidates subcollection (detailed evaluation data)
      const candidateRef = await getDB()
        .collection("users")
        .doc(userId)
        .collection("candidates")
        .add({
          ...evaluationData,
          jobId,
          evaluatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const candidateId = candidateRef.id;

      // Also save to resumes collection (for dashboard compatibility)
      await getDB()
        .collection("resumes")
        .doc(candidateId)
        .set({
          userId,
          candidateId,
          candidateName: evaluationData.candidateName,
          fileName: `${evaluationData.candidateName}_resume.pdf`,
          fileUrl: evaluationData.resumeUrl || "",
          skills:
            evaluationData.parsedResume?.skills?.join(", ") || "Not specified",
          experienceYears:
            evaluationData.parsedResume?.totalExperienceYears || 0,
          aiReasoning:
            evaluationData.finalScoring?.detailedReasoning || "Not available",
          status:
            evaluationData.finalScoring?.decision === "strong_accept" ||
            evaluationData.finalScoring?.decision === "accept" ||
            evaluationData.finalScoring?.decision === "maybe"
              ? "accepted"
              : "rejected",
          jobId,
          jobTitle: evaluationData.jobTitle || "Not specified",
          email: evaluationData.candidateEmail || "",
          phone: evaluationData.candidatePhone || "",
          createdAt: new Date(),
          updatedAt: new Date(),
          evaluatedAt: new Date(),
        });

      logger.info(
        `✅ Saved candidate ${evaluationData.candidateName} with ID: ${candidateId}`,
      );

      return candidateId;
    } catch (error: any) {
      logger.error(`❌ Failed to save candidate to Firebase:`, {
        candidateName: evaluationData.candidateName,
        userId,
        jobId,
        error: error.message,
      });
      throw new Error(`Failed to save evaluation: ${error.message}`);
    }
  }

  /**
   * Parse JSON response from LLM (handles markdown code blocks)
   */
  private parseJSONResponse(content: string): any {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      return JSON.parse(cleaned);
    } catch (error) {
      logger.error("Failed to parse LLM JSON response:", { content, error });
      return {};
    }
  }
}

export default EvaluationService;
