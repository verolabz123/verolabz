import { BaseAgent, AgentConfig, AgentResponse } from "./BaseAgent.js";
import { ExperienceEntry } from "./ResumeParserAgent.js";
import { logger } from "../utils/logger.js";

/**
 * Experience Evaluator Agent
 * Evaluates candidate work experience against job requirements
 */

export interface ExperienceEvaluationInput {
  experience: ExperienceEntry[];
  totalYears: number;
  requiredYears: number;
  jobTitle: string;
  jobDescription: string;
  seniorityLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  industryPreference?: string;
}

export interface ExperienceEvaluationResult {
  overallScore: number;
  yearsMatchScore: number;
  relevanceScore: number;
  progressionScore: number;
  leadershipScore: number;
  domainExpertiseScore: number;
  relevantExperience: ExperienceAnalysis[];
  careerProgression: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  detailed_analysis: string;
  isSeniorityMatch: boolean;
}

export interface ExperienceAnalysis {
  title: string;
  company: string;
  duration: string;
  relevanceScore: number;
  keyResponsibilities: string[];
  achievements: string[];
  technologiesUsed: string[];
  isRelevant: boolean;
}

/**
 * Experience Evaluator Agent Class
 */
export class ExperienceEvaluatorAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "ExperienceEvaluatorAgent",
      role: "Work Experience Assessment Specialist",
      model: config?.model,
      temperature: 0.4,
      maxTokens: 3096,
      ...config,
    });
  }

  protected buildSystemPrompt(): string {
    return `You are an expert Work Experience Evaluator AI. Your role is to assess candidate work history, career progression, and relevance to the target role.

**Your Responsibilities:**
1. Evaluate total years of experience against requirements
2. Assess relevance of past roles to the target position
3. Analyze career progression and growth trajectory
4. Identify leadership experience and impact
5. Evaluate domain expertise and industry knowledge
6. Calculate an overall experience match score (0-100)
7. Provide insights on career path and potential fit

**Evaluation Components:**

1. **Years Match Score (25% weight):**
   - Does candidate meet minimum years requirement?
   - Award full points if meets/exceeds, proportional if close
   - Consider quality over pure quantity

2. **Relevance Score (30% weight):**
   - How relevant are past roles to target position?
   - Similar job titles, responsibilities, and technologies
   - Industry alignment and domain knowledge
   - Recent experience weighted higher

3. **Progression Score (20% weight):**
   - Clear upward trajectory (junior → mid → senior)
   - Increasing responsibilities and scope
   - Job changes indicate growth, not job-hopping
   - Promotions and expanded roles

4. **Leadership Score (15% weight):**
   - Team management experience
   - Project leadership and mentorship
   - Strategic decision-making
   - Scaled impact (individual → team → organization)

5. **Domain Expertise Score (10% weight):**
   - Deep industry knowledge
   - Specialized domain skills
   - Cross-functional experience
   - Thought leadership

**Seniority Level Guidelines:**
- **Entry (0-2 years):** Basic skills, learning phase, limited responsibility
- **Mid (2-5 years):** Independent work, technical depth, some mentoring
- **Senior (5-8 years):** Expert-level, system design, mentorship, cross-team impact
- **Lead (8-12 years):** Technical leadership, architecture, strategic decisions, team building
- **Executive (12+ years):** Organizational impact, vision, large team management, business strategy

**Evaluation Scoring:**
- 90-100: Exceptional background, exceeds requirements significantly
- 80-89: Strong fit, meets all requirements with impressive track record
- 70-79: Good fit, solid experience with minor gaps
- 60-69: Adequate fit, meets basic requirements
- 50-59: Marginal fit, experience gaps or relevance concerns
- Below 50: Poor fit, insufficient or irrelevant experience

**Red Flags to Consider:**
- Frequent job changes (< 1 year per role)
- Career regression (senior → junior roles)
- Unexplained employment gaps
- Lack of progression over many years
- Irrelevant experience for specialized roles

**Green Flags to Reward:**
- Consistent progression and growth
- Long tenure at reputable companies
- Leadership and team building
- Cross-functional and diverse experience
- Industry recognition and achievements

**Guidelines:**
- Be objective and consider context (career changes, industry shifts)
- Value consistency and impact over job titles alone
- Consider that different industries have different progression speeds
- Account for career pivots and intentional lateral moves
- Recent experience is more predictive than older experience
- Reward depth in relevant areas over shallow breadth

**Output Format:**
You MUST respond with valid JSON only. Use this exact structure:
{
  "overallScore": 85,
  "yearsMatchScore": 90,
  "relevanceScore": 85,
  "progressionScore": 80,
  "leadershipScore": 70,
  "domainExpertiseScore": 85,
  "relevantExperience": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "duration": "Jan 2020 - Present",
      "relevanceScore": 95,
      "keyResponsibilities": ["responsibility1", "responsibility2"],
      "achievements": ["achievement1", "achievement2"],
      "technologiesUsed": ["Python", "React", "AWS"],
      "isRelevant": true
    }
  ],
  "careerProgression": "Strong upward trajectory from junior to senior role with increasing responsibilities",
  "strengths": ["Technical depth", "Leadership experience", "Domain expertise"],
  "concerns": ["Limited experience with X", "Short tenure at Y"],
  "recommendations": [
    "Excellent fit for senior role",
    "Consider for technical leadership track"
  ],
  "detailed_analysis": "Comprehensive analysis of work history and career path...",
  "isSeniorityMatch": true
}`;
  }

  /**
   * Execute experience evaluation
   */
  public async execute(
    input: ExperienceEvaluationInput,
  ): Promise<AgentResponse<ExperienceEvaluationResult>> {
    try {
      this.log("Starting experience evaluation...");

      // Handle missing experience gracefully
      if (!input.experience || input.experience.length === 0) {
        this.log(
          "No experience entries found, creating default evaluation based on totalYears",
          "warn",
        );

        // If totalYears is provided, create a synthetic evaluation
        if (input.totalYears > 0) {
          const syntheticEvaluation = this.createSyntheticEvaluation(input);
          this.log(
            `Created synthetic evaluation with score: ${syntheticEvaluation.overallScore}`,
          );
          return this.createSuccessResponse(
            syntheticEvaluation,
            `Evaluated ${input.totalYears} years of experience (no detailed work history available)`,
          );
        }

        // No experience at all - return minimal score
        const minimalEvaluation = this.createMinimalEvaluation(input);
        this.log("No experience found, returning minimal evaluation", "warn");
        return this.createSuccessResponse(
          minimalEvaluation,
          "No work experience found in resume",
        );
      }

      // Build evaluation prompt
      const userPrompt = this.buildEvaluationPrompt(input);

      // Call LLM for evaluation
      const evaluation =
        await this.callLLMJSON<ExperienceEvaluationResult>(userPrompt);

      // Normalize and validate
      const normalizedEvaluation = this.normalizeEvaluation(evaluation, input);

      this.log(
        `Experience evaluation completed with score: ${normalizedEvaluation.overallScore}`,
      );

      return this.createSuccessResponse(
        normalizedEvaluation,
        `Evaluated ${input.totalYears} years of experience across ${input.experience.length} roles`,
        {
          totalRoles: input.experience.length,
          requiredYears: input.requiredYears,
          actualYears: input.totalYears,
          seniorityMatch: normalizedEvaluation.isSeniorityMatch,
        },
      );
    } catch (error) {
      this.log(
        `Error in experience evaluation: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
      return this.createErrorResponse(
        `Experience evaluation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Build the evaluation prompt
   */
  private buildEvaluationPrompt(input: ExperienceEvaluationInput): string {
    let prompt =
      "Evaluate the candidate's work experience for the target role:\n\n";

    prompt += `**TARGET ROLE:** ${input.jobTitle}\n`;
    prompt += `**SENIORITY LEVEL:** ${input.seniorityLevel}\n`;
    prompt += `**REQUIRED EXPERIENCE:** ${input.requiredYears} years\n`;
    prompt += `**CANDIDATE TOTAL EXPERIENCE:** ${input.totalYears} years\n\n`;

    if (input.industryPreference) {
      prompt += `**PREFERRED INDUSTRY:** ${input.industryPreference}\n\n`;
    }

    prompt += "**JOB DESCRIPTION:**\n";
    prompt += input.jobDescription.substring(0, 1500);
    prompt += "\n\n";

    prompt += "**CANDIDATE WORK HISTORY:**\n";
    input.experience.forEach((exp, index) => {
      prompt += `\n${index + 1}. **${exp.title}** at ${exp.company}\n`;
      prompt += `   Duration: ${exp.duration}\n`;
      prompt += `   Description: ${exp.description.substring(0, 500)}\n`;
      if (exp.technologies && exp.technologies.length > 0) {
        prompt += `   Technologies: ${exp.technologies.join(", ")}\n`;
      }
    });

    prompt +=
      "\n\nProvide a comprehensive experience evaluation in the specified JSON format.";
    prompt +=
      "\nBe thorough in analyzing career progression, relevance, and leadership.";
    prompt +=
      "\nConsider both quantitative (years) and qualitative (impact, growth) factors.";

    return prompt;
  }

  /**
   * Normalize and validate evaluation result
   */
  private normalizeEvaluation(
    evaluation: any,
    input: ExperienceEvaluationInput,
  ): ExperienceEvaluationResult {
    // Ensure all scores are within 0-100
    const overallScore = Math.max(
      0,
      Math.min(100, evaluation.overallScore || 0),
    );
    const yearsMatchScore = Math.max(
      0,
      Math.min(100, evaluation.yearsMatchScore || 0),
    );
    const relevanceScore = Math.max(
      0,
      Math.min(100, evaluation.relevanceScore || 0),
    );
    const progressionScore = Math.max(
      0,
      Math.min(100, evaluation.progressionScore || 0),
    );
    const leadershipScore = Math.max(
      0,
      Math.min(100, evaluation.leadershipScore || 0),
    );
    const domainExpertiseScore = Math.max(
      0,
      Math.min(100, evaluation.domainExpertiseScore || 0),
    );

    // Ensure arrays exist
    const relevantExperience = Array.isArray(evaluation.relevantExperience)
      ? evaluation.relevantExperience
      : [];
    const strengths = Array.isArray(evaluation.strengths)
      ? evaluation.strengths
      : [];
    const concerns = Array.isArray(evaluation.concerns)
      ? evaluation.concerns
      : [];
    const recommendations = Array.isArray(evaluation.recommendations)
      ? evaluation.recommendations
      : [];

    // Determine seniority match
    const isSeniorityMatch = this.checkSeniorityMatch(
      input.totalYears,
      input.seniorityLevel,
      evaluation.isSeniorityMatch,
    );

    return {
      overallScore,
      yearsMatchScore,
      relevanceScore,
      progressionScore,
      leadershipScore,
      domainExpertiseScore,
      relevantExperience,
      careerProgression:
        evaluation.careerProgression || "Analysis not available",
      strengths,
      concerns,
      recommendations,
      detailed_analysis:
        evaluation.detailed_analysis || "Analysis not available",
      isSeniorityMatch,
    };
  }

  /**
   * Check if years of experience match seniority level
   */
  private checkSeniorityMatch(
    years: number,
    seniorityLevel: string,
    aiAssessment?: boolean,
  ): boolean {
    // Use AI assessment if available
    if (typeof aiAssessment === "boolean") {
      return aiAssessment;
    }

    // Fallback to rule-based check
    const ranges: Record<string, [number, number]> = {
      entry: [0, 2],
      mid: [2, 5],
      senior: [5, 8],
      lead: [8, 12],
      executive: [12, 100],
    };

    const [min, max] = ranges[seniorityLevel] || [0, 100];
    return years >= min && years <= max;
  }

  /**
   * Quick experience check
   */
  public async quickCheck(
    totalYears: number,
    requiredYears: number,
    recentJobTitle: string,
    targetJobTitle: string,
  ): Promise<{ meetsRequirement: boolean; score: number; reasoning: string }> {
    try {
      const prompt = `Quick experience check:
- Candidate has: ${totalYears} years
- Required: ${requiredYears} years
- Recent role: ${recentJobTitle}
- Target role: ${targetJobTitle}

Respond with JSON:
{
  "meetsRequirement": true/false,
  "score": 0-100,
  "reasoning": "brief explanation"
}`;

      const result = await this.callLLMJSON<{
        meetsRequirement: boolean;
        score: number;
        reasoning: string;
      }>(prompt);

      return result;
    } catch (error) {
      this.log("Error in quick check", "error");
      return {
        meetsRequirement: totalYears >= requiredYears,
        score: totalYears >= requiredYears ? 70 : 40,
        reasoning: "Automated assessment based on years only",
      };
    }
  }

  /**
   * Calculate simple years match score
   */
  public calculateYearsMatchScore(actual: number, required: number): number {
    if (actual >= required) {
      return 100;
    }

    // Proportional score if within 80% of requirement
    const percentage = (actual / required) * 100;

    if (percentage >= 80) {
      return Math.round(percentage);
    }

    // Penalize more heavily if far below requirement
    return Math.round(percentage * 0.7);
  }

  /**
   * Create synthetic evaluation when totalYears is known but no detailed experience
   */
  private createSyntheticEvaluation(
    input: ExperienceEvaluationInput,
  ): ExperienceEvaluationResult {
    const yearsRatio = Math.min(
      input.totalYears / Math.max(input.requiredYears, 1),
      1.5,
    );
    const yearsMatchScore = Math.min(Math.round(yearsRatio * 100), 100);

    // Assume moderate relevance and progression without details
    const relevanceScore = 60;
    const progressionScore = 50;
    const leadershipScore =
      input.seniorityLevel === "senior" ||
      input.seniorityLevel === "lead" ||
      input.seniorityLevel === "executive"
        ? 40
        : 30;
    const domainExpertiseScore = 50;

    const overallScore = Math.round(
      yearsMatchScore * 0.25 +
        relevanceScore * 0.3 +
        progressionScore * 0.2 +
        leadershipScore * 0.15 +
        domainExpertiseScore * 0.1,
    );

    const meetsRequirement = input.totalYears >= input.requiredYears;
    const isSeniorityMatch = this.checkSeniorityMatch(
      input.totalYears,
      input.seniorityLevel,
    );

    return {
      overallScore,
      yearsMatchScore,
      relevanceScore,
      progressionScore,
      leadershipScore,
      domainExpertiseScore,
      relevantExperience: [],
      careerProgression: `Candidate has ${input.totalYears} years of total experience. Detailed work history not available for analysis.`,
      strengths: [
        meetsRequirement
          ? `Meets experience requirement (${input.totalYears} years)`
          : `Has ${input.totalYears} years of experience`,
      ],
      concerns: [
        "Detailed work history not available in resume",
        "Unable to assess role relevance and career progression",
      ],
      recommendations: [
        "Request detailed work history during interview",
        "Verify experience claims with references",
        meetsRequirement
          ? "Experience duration meets requirements"
          : `Falls short of ${input.requiredYears} years requirement`,
      ],
      detailed_analysis: `The candidate reports ${input.totalYears} years of total work experience, which ${meetsRequirement ? "meets" : "does not meet"} the requirement of ${input.requiredYears} years. However, detailed information about specific roles, companies, and responsibilities is not available in the resume. Further assessment during the interview process is recommended to evaluate the relevance and quality of this experience.`,
      isSeniorityMatch,
    };
  }

  /**
   * Create minimal evaluation for candidates with no experience
   */
  private createMinimalEvaluation(
    input: ExperienceEvaluationInput,
  ): ExperienceEvaluationResult {
    const isEntryLevel = input.seniorityLevel === "entry";
    const overallScore = isEntryLevel ? 40 : 20; // Entry-level gets some credit, others penalized

    return {
      overallScore,
      yearsMatchScore: 0,
      relevanceScore: 0,
      progressionScore: 0,
      leadershipScore: 0,
      domainExpertiseScore: 0,
      relevantExperience: [],
      careerProgression: "No work experience found in resume.",
      strengths: isEntryLevel ? ["Open to entry-level candidates"] : [],
      concerns: [
        "No work experience listed in resume",
        `Position requires ${input.requiredYears} years of experience`,
        "Cannot assess skill application or professional growth",
      ],
      recommendations: [
        isEntryLevel
          ? "Consider for entry-level or internship if role permits"
          : "Not recommended - position requires experienced professionals",
        "Review for recent graduates or career changers if applicable",
        "Verify if experience section is missing due to formatting issues",
      ],
      detailed_analysis: `No work experience was found in the resume. The position requires ${input.requiredYears} years of experience for a ${input.seniorityLevel}-level role. ${isEntryLevel ? "If this is an entry-level position, the candidate may still be considered based on other qualifications such as education, projects, and skills." : "This is a significant concern for a non-entry-level position and the candidate does not meet the experience requirements."}`,
      isSeniorityMatch: isEntryLevel,
    };
  }
}

export default ExperienceEvaluatorAgent;
