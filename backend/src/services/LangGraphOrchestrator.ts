// @ts-nocheck
import { StateGraph, END, START } from "@langchain/langgraph";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { logger } from "../utils/logger.js";
import { getGroqModel } from "../config/groq.js";

// State interface for the workflow
interface EvaluationState {
  // Input
  resumeText: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: number;
  seniorityLevel: string;
  industryPreference?: string;

  // Intermediate results
  parsedResume?: any;
  skillsEvaluation?: any;
  experienceEvaluation?: any;
  culturalFit?: any;
  finalScore?: number;
  decision?: string;
  confidence?: number;

  // Messages for agent communication
  messages: BaseMessage[];

  // Metadata
  currentStep?: string;
  errors: string[];
  processingTime?: number;
}

/**
 * LangGraph-based Multi-Agent Orchestrator for Candidate Evaluation
 *
 * This orchestrator uses LangGraph to coordinate multiple AI agents in a
 * structured workflow for comprehensive candidate evaluation.
 */
export class LangGraphOrchestrator {
  private llm: ChatGroq;
  private graph: any;

  constructor() {
    // Initialize Groq LLM
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required");
    }

    this.llm = new ChatGroq({
      apiKey,
      modelName: getGroqModel(),
      temperature: 0.7,
    });

    // Build the evaluation graph
    this.graph = this.buildEvaluationGraph();
  }

  /**
   * Build the LangGraph workflow for candidate evaluation
   */
  private buildEvaluationGraph() {
    // Create the state graph
    const workflow = new StateGraph<EvaluationState>({
      channels: {
        resumeText: null,
        candidateName: null,
        candidateEmail: null,
        candidatePhone: null,
        jobTitle: null,
        jobDescription: null,
        requiredSkills: null,
        preferredSkills: null,
        requiredExperience: null,
        seniorityLevel: null,
        industryPreference: null,
        parsedResume: null,
        skillsEvaluation: null,
        experienceEvaluation: null,
        culturalFit: null,
        finalScore: null,
        decision: null,
        confidence: null,
        messages: null,
        currentStep: null,
        errors: null,
        processingTime: null,
      },
    });

    // Add nodes for each evaluation step
    workflow.addNode("parse_resume", this.parseResumeNode.bind(this));
    workflow.addNode("evaluate_skills", this.evaluateSkillsNode.bind(this));
    workflow.addNode(
      "evaluate_experience",
      this.evaluateExperienceNode.bind(this),
    );
    workflow.addNode(
      "evaluate_cultural_fit",
      this.evaluateCulturalFitNode.bind(this),
    );
    workflow.addNode("final_scoring", this.finalScoringNode.bind(this));

    // Define the workflow edges
    workflow.addEdge(START, "parse_resume");
    workflow.addEdge("parse_resume", "evaluate_skills");
    workflow.addEdge("evaluate_skills", "evaluate_experience");
    workflow.addEdge("evaluate_experience", "evaluate_cultural_fit");
    workflow.addEdge("evaluate_cultural_fit", "final_scoring");
    workflow.addEdge("final_scoring", END);

    // Compile the graph
    return workflow.compile();
  }

  /**
   * Node: Parse Resume
   * Extracts structured information from resume text
   */
  private async parseResumeNode(
    state: EvaluationState,
  ): Promise<Partial<EvaluationState>> {
    logger.info("[LangGraph] Starting resume parsing...");
    state.currentStep = "parse_resume";

    try {
      const prompt = `You are an expert resume parser. Extract structured information from the following resume.

Resume Text:
${state.resumeText}

Extract and return a JSON object with the following structure:
{
  "name": "candidate full name",
  "email": "email address",
  "phone": "phone number",
  "summary": "professional summary",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "duration",
      "description": "job description",
      "achievements": ["achievement1", ...]
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year",
      "gpa": "GPA if available"
    }
  ],
  "certifications": ["cert1", "cert2", ...],
  "totalExperienceYears": number,
  "languages": ["lang1", "lang2", ...]
}

Return ONLY the JSON object, no additional text.`;

      const response = await this.llm.invoke([
        new SystemMessage(
          "You are an expert resume parser. Always return valid JSON.",
        ),
        new HumanMessage(prompt),
      ]);

      // Parse the JSON response
      let jsonText = response.content.toString().trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      const parsedResume = JSON.parse(jsonText);

      // Override with provided values if available
      if (state.candidateName) parsedResume.name = state.candidateName;
      if (state.candidateEmail) parsedResume.email = state.candidateEmail;
      if (state.candidatePhone) parsedResume.phone = state.candidatePhone;

      logger.info("[LangGraph] Resume parsed successfully");

      return {
        parsedResume,
        messages: [...state.messages, response],
      };
    } catch (error: any) {
      logger.error("[LangGraph] Error parsing resume:", error);
      return {
        errors: [...state.errors, `Resume parsing failed: ${error.message}`],
      };
    }
  }

  /**
   * Node: Evaluate Skills
   * Assesses candidate's skills against job requirements
   */
  private async evaluateSkillsNode(
    state: EvaluationState,
  ): Promise<Partial<EvaluationState>> {
    logger.info("[LangGraph] Starting skills evaluation...");
    state.currentStep = "evaluate_skills";

    try {
      const candidateSkills = state.parsedResume?.skills || [];
      const requiredSkills = state.requiredSkills;
      const preferredSkills = state.preferredSkills || [];

      const prompt = `You are an expert technical recruiter. Evaluate the candidate's skills against job requirements.

Candidate Skills: ${candidateSkills.join(", ")}
Required Skills: ${requiredSkills.join(", ")}
Preferred Skills: ${preferredSkills.join(", ")}

Job Title: ${state.jobTitle}
Job Description: ${state.jobDescription}

Analyze the skills match and return a JSON object with:
{
  "overallScore": number (0-100),
  "matchedRequiredSkills": ["skill1", ...],
  "missingRequiredSkills": ["skill1", ...],
  "matchedPreferredSkills": ["skill1", ...],
  "additionalSkills": ["skill1", ...],
  "strengthAreas": ["area1", "area2", ...],
  "weaknessAreas": ["area1", "area2", ...],
  "technicalDepth": "junior|mid|senior|expert",
  "recommendations": ["rec1", "rec2", ...],
  "reasoning": "detailed explanation"
}

Return ONLY the JSON object.`;

      const response = await this.llm.invoke([
        new SystemMessage(
          "You are an expert technical recruiter. Always return valid JSON.",
        ),
        new HumanMessage(prompt),
      ]);

      let jsonText = response.content.toString().trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      const skillsEvaluation = JSON.parse(jsonText);

      logger.info(
        `[LangGraph] Skills evaluated - Score: ${skillsEvaluation.overallScore}`,
      );

      return {
        skillsEvaluation,
        messages: [...state.messages, response],
      };
    } catch (error: any) {
      logger.error("[LangGraph] Error evaluating skills:", error);
      return {
        errors: [...state.errors, `Skills evaluation failed: ${error.message}`],
      };
    }
  }

  /**
   * Node: Evaluate Experience
   * Assesses candidate's work experience and career progression
   */
  private async evaluateExperienceNode(
    state: EvaluationState,
  ): Promise<Partial<EvaluationState>> {
    logger.info("[LangGraph] Starting experience evaluation...");
    state.currentStep = "evaluate_experience";

    try {
      const experience = state.parsedResume?.experience || [];
      const totalYears = state.parsedResume?.totalExperienceYears || 0;

      const prompt = `You are an expert HR analyst. Evaluate the candidate's work experience.

Candidate Experience:
${JSON.stringify(experience, null, 2)}

Total Years: ${totalYears}
Required Years: ${state.requiredExperience}
Required Seniority: ${state.seniorityLevel}
Job Title: ${state.jobTitle}
Industry: ${state.industryPreference || "Any"}

Analyze and return a JSON object with:
{
  "overallScore": number (0-100),
  "yearsMatchScore": number (0-100),
  "relevanceScore": number (0-100),
  "progressionScore": number (0-100),
  "leadershipScore": number (0-100),
  "industryExperience": "none|some|extensive",
  "careerProgression": "declining|stable|growing|rapidly_growing",
  "seniorityMatch": true|false,
  "keyAchievements": ["achievement1", ...],
  "redFlags": ["flag1", ...],
  "strengths": ["strength1", ...],
  "reasoning": "detailed explanation"
}

Return ONLY the JSON object.`;

      const response = await this.llm.invoke([
        new SystemMessage(
          "You are an expert HR analyst. Always return valid JSON.",
        ),
        new HumanMessage(prompt),
      ]);

      let jsonText = response.content.toString().trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      const experienceEvaluation = JSON.parse(jsonText);

      logger.info(
        `[LangGraph] Experience evaluated - Score: ${experienceEvaluation.overallScore}`,
      );

      return {
        experienceEvaluation,
        messages: [...state.messages, response],
      };
    } catch (error: any) {
      logger.error("[LangGraph] Error evaluating experience:", error);
      return {
        errors: [
          ...state.errors,
          `Experience evaluation failed: ${error.message}`,
        ],
      };
    }
  }

  /**
   * Node: Evaluate Cultural Fit
   * Assesses candidate's potential cultural fit based on resume content
   */
  private async evaluateCulturalFitNode(
    state: EvaluationState,
  ): Promise<Partial<EvaluationState>> {
    logger.info("[LangGraph] Starting cultural fit evaluation...");
    state.currentStep = "evaluate_cultural_fit";

    try {
      const summary = state.parsedResume?.summary || "";
      const experience = state.parsedResume?.experience || [];

      const prompt = `You are an organizational psychologist. Assess the candidate's potential cultural fit.

Professional Summary: ${summary}
Job Description: ${state.jobDescription}
Experience Highlights: ${JSON.stringify(experience.slice(0, 3), null, 2)}

Analyze indicators of cultural fit and return a JSON object with:
{
  "overallScore": number (0-100),
  "communicationStyle": "direct|collaborative|formal|casual",
  "workStyle": "independent|team-oriented|hybrid",
  "adaptability": number (0-100),
  "initiative": number (0-100),
  "collaboration": number (0-100),
  "positiveIndicators": ["indicator1", ...],
  "concerns": ["concern1", ...],
  "reasoning": "detailed explanation"
}

Return ONLY the JSON object.`;

      const response = await this.llm.invoke([
        new SystemMessage(
          "You are an organizational psychologist. Always return valid JSON.",
        ),
        new HumanMessage(prompt),
      ]);

      let jsonText = response.content.toString().trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      const culturalFit = JSON.parse(jsonText);

      logger.info(
        `[LangGraph] Cultural fit evaluated - Score: ${culturalFit.overallScore}`,
      );

      return {
        culturalFit,
        messages: [...state.messages, response],
      };
    } catch (error: any) {
      logger.error("[LangGraph] Error evaluating cultural fit:", error);
      return {
        errors: [
          ...state.errors,
          `Cultural fit evaluation failed: ${error.message}`,
        ],
      };
    }
  }

  /**
   * Node: Final Scoring
   * Synthesizes all evaluations into a final decision
   */
  private async finalScoringNode(
    state: EvaluationState,
  ): Promise<Partial<EvaluationState>> {
    logger.info("[LangGraph] Starting final scoring...");
    state.currentStep = "final_scoring";

    try {
      const skillsScore = state.skillsEvaluation?.overallScore || 0;
      const experienceScore = state.experienceEvaluation?.overallScore || 0;
      const culturalFitScore = state.culturalFit?.overallScore || 0;

      const prompt = `You are a senior hiring manager. Make the final hiring decision.

Skills Evaluation Score: ${skillsScore}/100
${JSON.stringify(state.skillsEvaluation, null, 2)}

Experience Evaluation Score: ${experienceScore}/100
${JSON.stringify(state.experienceEvaluation, null, 2)}

Cultural Fit Score: ${culturalFitScore}/100
${JSON.stringify(state.culturalFit, null, 2)}

Job Requirements:
- Title: ${state.jobTitle}
- Required Skills: ${state.requiredSkills.join(", ")}
- Required Experience: ${state.requiredExperience} years
- Seniority: ${state.seniorityLevel}

Return a JSON object with:
{
  "finalScore": number (0-100, weighted average),
  "decision": "strong_yes|yes|maybe|no|strong_no",
  "confidence": number (0-100),
  "componentScores": {
    "skills": number,
    "experience": number,
    "culturalFit": number
  },
  "strengths": ["strength1", ...],
  "weaknesses": ["weakness1", ...],
  "recommendations": ["rec1", ...],
  "interviewSuggestions": ["question1", ...],
  "detailedReasoning": "comprehensive explanation of the decision",
  "nextSteps": "recommended actions"
}

Weights: Skills 40%, Experience 35%, Cultural Fit 25%
Return ONLY the JSON object.`;

      const response = await this.llm.invoke([
        new SystemMessage(
          "You are a senior hiring manager. Always return valid JSON.",
        ),
        new HumanMessage(prompt),
      ]);

      let jsonText = response.content.toString().trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
      }

      const finalScoring = JSON.parse(jsonText);

      logger.info(
        `[LangGraph] Final scoring complete - Score: ${finalScoring.finalScore}, Decision: ${finalScoring.decision}`,
      );

      return {
        finalScore: finalScoring.finalScore,
        decision: finalScoring.decision,
        confidence: finalScoring.confidence,
        messages: [...state.messages, response],
      };
    } catch (error: any) {
      logger.error("[LangGraph] Error in final scoring:", error);
      return {
        errors: [...state.errors, `Final scoring failed: ${error.message}`],
      };
    }
  }

  /**
   * Execute the evaluation workflow
   */
  async evaluate(input: {
    resumeText: string;
    candidateName?: string;
    candidateEmail?: string;
    candidatePhone?: string;
    jobTitle: string;
    jobDescription: string;
    requiredSkills: string[];
    preferredSkills?: string[];
    requiredExperience: number;
    seniorityLevel: string;
    industryPreference?: string;
  }): Promise<any> {
    const startTime = Date.now();

    logger.info("[LangGraph] Starting candidate evaluation workflow");

    // Initialize state
    const initialState: EvaluationState = {
      resumeText: input.resumeText,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
      candidatePhone: input.candidatePhone,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      requiredSkills: input.requiredSkills,
      preferredSkills: input.preferredSkills || [],
      requiredExperience: input.requiredExperience,
      seniorityLevel: input.seniorityLevel,
      industryPreference: input.industryPreference,
      messages: [],
      errors: [],
    };

    try {
      // Execute the workflow
      const result = await this.graph.invoke(initialState);

      const processingTime = Date.now() - startTime;

      logger.info(`[LangGraph] Evaluation completed in ${processingTime}ms`);

      return {
        success: true,
        parsedResume: result.parsedResume,
        skillsEvaluation: result.skillsEvaluation,
        experienceEvaluation: result.experienceEvaluation,
        culturalFit: result.culturalFit,
        finalScore: result.finalScore,
        decision: result.decision,
        confidence: result.confidence,
        processingTime,
        errors: result.errors,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error("[LangGraph] Evaluation workflow failed:", error);

      return {
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * Get workflow information
   */
  getWorkflowInfo() {
    return {
      name: "LangGraph Candidate Evaluation Workflow",
      version: "1.0.0",
      nodes: [
        {
          name: "parse_resume",
          description: "Extract structured data from resume",
        },
        {
          name: "evaluate_skills",
          description: "Assess technical and soft skills",
        },
        {
          name: "evaluate_experience",
          description: "Analyze work experience and progression",
        },
        {
          name: "evaluate_cultural_fit",
          description: "Evaluate cultural fit indicators",
        },
        {
          name: "final_scoring",
          description: "Generate final score and decision",
        },
      ],
      weights: {
        skills: 0.4,
        experience: 0.35,
        culturalFit: 0.25,
      },
    };
  }
}

export default LangGraphOrchestrator;
