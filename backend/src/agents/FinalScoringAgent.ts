import { BaseAgent, AgentConfig, AgentResponse } from './BaseAgent.js';
import { SkillsEvaluationResult } from './SkillsEvaluatorAgent.js';
import { ExperienceEvaluationResult } from './ExperienceEvaluatorAgent.js';
import { ParsedResume } from './ResumeParserAgent.js';
import { logger } from '../utils/logger.js';

/**
 * Final Scoring Agent
 * Combines all evaluations to produce final candidate score and decision
 */

export interface FinalScoringInput {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobDescription: string;
  parsedResume: ParsedResume;
  skillsEvaluation: SkillsEvaluationResult;
  experienceEvaluation: ExperienceEvaluationResult;
  customWeights?: ScoringWeights;
}

export interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
  cultural: number;
}

export interface FinalScoringResult {
  finalScore: number;
  decision: 'shortlisted' | 'rejected' | 'review';
  confidence: number;
  componentScores: {
    skills: number;
    experience: number;
    education: number;
    overall: number;
  };
  strengths: string[];
  weaknesses: string[];
  keyHighlights: string[];
  detailedReasoning: string;
  recommendations: string[];
  interviewSuggestions: string[];
  riskFactors: string[];
  fitAnalysis: {
    technical: number;
    experience: number;
    growth: number;
    culture: number;
  };
}

/**
 * Final Scoring Agent Class
 */
export class FinalScoringAgent extends BaseAgent {
  private readonly DEFAULT_WEIGHTS: ScoringWeights = {
    skills: 0.5,      // 50% - Technical skills are critical
    experience: 0.35, // 35% - Work experience and relevance
    education: 0.10,  // 10% - Educational background
    cultural: 0.05,   // 5% - Cultural fit indicators
  };

  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'FinalScoringAgent',
      role: 'Holistic Candidate Assessment Specialist',
      model: config?.model,
      temperature: 0.3,
      maxTokens: 4096,
      ...config,
    });
  }

  protected buildSystemPrompt(): string {
    return `You are an expert Final Candidate Scoring AI. Your role is to synthesize all evaluation components into a final, holistic assessment and hiring recommendation.

**Your Responsibilities:**
1. Combine technical skills, experience, and qualifications into a unified score
2. Make a clear hiring decision: Shortlist, Reject, or Needs Review
3. Provide comprehensive reasoning for the decision
4. Identify key strengths and weaknesses
5. Suggest interview focus areas if shortlisted
6. Highlight risk factors that require attention
7. Assess overall candidate fit across multiple dimensions

**Scoring Components:**
- **Skills (50% weight):** Technical proficiency and skill match
- **Experience (35% weight):** Work history, relevance, and progression
- **Education (10% weight):** Academic qualifications and certifications
- **Cultural Fit (5% weight):** Soft skills, values, and team alignment indicators

**Final Score Calculation:**
- Weighted average of all components
- Range: 0-100
- Adjusted based on critical gaps or exceptional qualities

**Decision Guidelines:**

**SHORTLIST (Score 75+):**
- Strong technical skills with minimal gaps
- Relevant experience meeting requirements
- Clear evidence of growth and impact
- No major red flags
- High confidence in candidate success

**REVIEW (Score 60-74):**
- Mixed evaluation with both strengths and concerns
- Some skill or experience gaps but shows potential
- Unclear aspects requiring interview clarification
- Moderate confidence, needs human judgment

**REJECT (Score <60):**
- Significant skill or experience gaps
- Lack of relevant background
- Major red flags or concerns
- Low confidence in role success
- Better candidates likely available

**Confidence Level:**
- **High (90-100%):** Clear decision based on strong evidence
- **Medium (70-89%):** Reasonable decision with some uncertainties
- **Low (<70%):** Limited information or conflicting signals

**Critical Considerations:**
1. **Must-Have Requirements:** Missing critical skills → lower score significantly
2. **Experience Relevance:** Recent, relevant experience → higher weight
3. **Growth Trajectory:** Upward progression → bonus points
4. **Red Flags:** Job hopping, gaps, skill mismatches → penalty
5. **Green Flags:** Leadership, certifications, achievements → bonus
6. **Cultural Indicators:** Communication, teamwork, values alignment

**Interview Suggestions (if Shortlisted):**
- Focus on areas where evaluation was uncertain
- Probe skill depth in critical technologies
- Assess soft skills and team fit
- Clarify experience details and achievements
- Evaluate problem-solving approach

**Risk Factors to Highlight:**
- Skill gaps requiring training
- Limited experience in specific areas
- Potential over/under qualification
- Cultural fit concerns
- Compensation expectations vs. budget

**Output Format:**
You MUST respond with valid JSON only. Use this exact structure:
{
  "finalScore": 85,
  "decision": "shortlisted",
  "confidence": 88,
  "componentScores": {
    "skills": 90,
    "experience": 85,
    "education": 75,
    "overall": 85
  },
  "strengths": [
    "Strong technical foundation in required technologies",
    "Excellent career progression from junior to senior",
    "Proven leadership and mentorship experience"
  ],
  "weaknesses": [
    "Limited experience with cloud infrastructure",
    "No formal certification in domain X"
  ],
  "keyHighlights": [
    "7 years of Python development",
    "Led team of 5 engineers",
    "Increased system performance by 40%"
  ],
  "detailedReasoning": "Comprehensive explanation of the decision, covering technical fit, experience relevance, growth potential, and overall assessment...",
  "recommendations": [
    "Strong candidate for senior backend role",
    "Recommend technical interview to assess system design skills",
    "Consider for fast-track interview process"
  ],
  "interviewSuggestions": [
    "Deep dive into microservices architecture experience",
    "Ask about specific AWS services used",
    "Assess leadership style and team management approach",
    "Discuss approach to code review and mentoring"
  ],
  "riskFactors": [
    "May require training on Kubernetes",
    "Relatively short tenure at last company (1.5 years)",
    "Salary expectations may be above budget"
  ],
  "fitAnalysis": {
    "technical": 90,
    "experience": 85,
    "growth": 88,
    "culture": 80
  }
}

**Guidelines:**
- Be decisive but fair in recommendations
- Provide specific, actionable insights
- Balance optimism with realistic assessment
- Consider company needs and candidate potential
- Always explain reasoning clearly
- Acknowledge uncertainties honestly`;
  }

  /**
   * Execute final scoring
   */
  public async execute(input: FinalScoringInput): Promise<AgentResponse<FinalScoringResult>> {
    try {
      this.log('Starting final candidate scoring...');

      // Calculate preliminary scores
      const preliminaryScore = this.calculatePreliminaryScore(input);

      // Build comprehensive evaluation prompt
      const userPrompt = this.buildScoringPrompt(input, preliminaryScore);

      // Call LLM for final assessment
      const finalAssessment = await this.callLLMJSON<FinalScoringResult>(userPrompt);

      // Validate and normalize the result
      const normalizedResult = this.normalizeResult(finalAssessment, preliminaryScore);

      this.log(`Final scoring completed: ${normalizedResult.finalScore}/100 - Decision: ${normalizedResult.decision}`);

      return this.createSuccessResponse(
        normalizedResult,
        `Candidate evaluated with ${normalizedResult.confidence}% confidence`,
        {
          decision: normalizedResult.decision,
          score: normalizedResult.finalScore,
          confidence: normalizedResult.confidence,
        }
      );

    } catch (error) {
      this.log(`Error in final scoring: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return this.createErrorResponse(
        `Final scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate preliminary weighted score
   */
  private calculatePreliminaryScore(input: FinalScoringInput): number {
    const weights = input.customWeights || this.DEFAULT_WEIGHTS;

    // Skills score
    const skillsScore = input.skillsEvaluation.overallScore;

    // Experience score
    const experienceScore = input.experienceEvaluation.overallScore;

    // Education score (based on education entries and certifications)
    const educationScore = this.calculateEducationScore(input.parsedResume);

    // Cultural fit score (basic estimation from resume)
    const culturalScore = this.estimateCulturalFit(input.parsedResume);

    // Weighted average
    const preliminaryScore =
      skillsScore * weights.skills +
      experienceScore * weights.experience +
      educationScore * weights.education +
      culturalScore * weights.cultural;

    return Math.round(preliminaryScore);
  }

  /**
   * Calculate education score
   */
  private calculateEducationScore(resume: ParsedResume): number {
    let score = 50; // Base score

    // Points for education
    if (resume.education && resume.education.length > 0) {
      score += 20; // Has at least one degree

      // Bonus for advanced degrees
      const hasAdvancedDegree = resume.education.some(edu =>
        edu.degree.toLowerCase().includes('master') ||
        edu.degree.toLowerCase().includes('phd') ||
        edu.degree.toLowerCase().includes('doctorate')
      );

      if (hasAdvancedDegree) {
        score += 15;
      }
    }

    // Points for certifications
    if (resume.certifications && resume.certifications.length > 0) {
      score += Math.min(15, resume.certifications.length * 5); // Up to 15 points
    }

    return Math.min(100, score);
  }

  /**
   * Estimate cultural fit from resume indicators
   */
  private estimateCulturalFit(resume: ParsedResume): number {
    let score = 70; // Base score (neutral)

    // Indicators of good cultural fit
    const positiveIndicators = [
      'team', 'collaboration', 'leadership', 'mentorship', 'communication',
      'agile', 'cross-functional', 'stakeholder', 'presentation'
    ];

    const resumeText = JSON.stringify(resume).toLowerCase();

    const matchedIndicators = positiveIndicators.filter(indicator =>
      resumeText.includes(indicator)
    );

    // Add points for cultural indicators (up to 30 points)
    score += Math.min(30, matchedIndicators.length * 5);

    return Math.min(100, score);
  }

  /**
   * Build comprehensive scoring prompt
   */
  private buildScoringPrompt(input: FinalScoringInput, preliminaryScore: number): string {
    let prompt = `Provide a final, holistic candidate assessment for this hiring decision:\n\n`;

    prompt += `**CANDIDATE:** ${input.candidateName} (${input.candidateEmail})\n`;
    prompt += `**TARGET ROLE:** ${input.jobTitle}\n`;
    prompt += `**PRELIMINARY SCORE:** ${preliminaryScore}/100\n\n`;

    prompt += `**JOB DESCRIPTION:**\n${input.jobDescription.substring(0, 1000)}\n\n`;

    // Resume Summary
    prompt += `**CANDIDATE PROFILE:**\n`;
    prompt += `- Total Experience: ${input.parsedResume.totalExperienceYears} years\n`;
    prompt += `- Skills: ${input.parsedResume.skills.slice(0, 10).join(', ')}${input.parsedResume.skills.length > 10 ? '...' : ''}\n`;
    prompt += `- Education: ${input.parsedResume.education.map(e => e.degree).join(', ')}\n`;
    if (input.parsedResume.certifications.length > 0) {
      prompt += `- Certifications: ${input.parsedResume.certifications.slice(0, 5).join(', ')}\n`;
    }
    prompt += `\n`;

    // Skills Evaluation Summary
    prompt += `**SKILLS EVALUATION (Score: ${input.skillsEvaluation.overallScore}/100):**\n`;
    prompt += `- Matched Skills: ${input.skillsEvaluation.matchedSkills.length}\n`;
    prompt += `- Missing Critical: ${input.skillsEvaluation.missingCriticalSkills.join(', ')}\n`;
    prompt += `- Strength Areas: ${input.skillsEvaluation.strengthAreas.join(', ')}\n`;
    if (input.skillsEvaluation.weaknessAreas.length > 0) {
      prompt += `- Weakness Areas: ${input.skillsEvaluation.weaknessAreas.join(', ')}\n`;
    }
    prompt += `\n`;

    // Experience Evaluation Summary
    prompt += `**EXPERIENCE EVALUATION (Score: ${input.experienceEvaluation.overallScore}/100):**\n`;
    prompt += `- Years Match: ${input.experienceEvaluation.yearsMatchScore}/100\n`;
    prompt += `- Relevance: ${input.experienceEvaluation.relevanceScore}/100\n`;
    prompt += `- Progression: ${input.experienceEvaluation.progressionScore}/100\n`;
    prompt += `- Leadership: ${input.experienceEvaluation.leadershipScore}/100\n`;
    prompt += `- Career Trajectory: ${input.experienceEvaluation.careerProgression}\n`;
    if (input.experienceEvaluation.strengths.length > 0) {
      prompt += `- Strengths: ${input.experienceEvaluation.strengths.join(', ')}\n`;
    }
    if (input.experienceEvaluation.concerns.length > 0) {
      prompt += `- Concerns: ${input.experienceEvaluation.concerns.join(', ')}\n`;
    }
    prompt += `\n`;

    // Recent Work Experience
    if (input.parsedResume.experience.length > 0) {
      prompt += `**RECENT WORK EXPERIENCE:**\n`;
      input.parsedResume.experience.slice(0, 2).forEach((exp, idx) => {
        prompt += `${idx + 1}. ${exp.title} at ${exp.company} (${exp.duration})\n`;
        prompt += `   ${exp.description.substring(0, 200)}...\n`;
      });
      prompt += `\n`;
    }

    prompt += `**TASK:**\n`;
    prompt += `Synthesize all the above information into a final, actionable hiring recommendation.\n`;
    prompt += `Consider the preliminary score of ${preliminaryScore} as a starting point.\n`;
    prompt += `Make a clear decision: shortlisted, rejected, or review.\n`;
    prompt += `Provide comprehensive reasoning, strengths, weaknesses, and recommendations.\n`;
    prompt += `\nRespond with the specified JSON format.`;

    return prompt;
  }

  /**
   * Normalize and validate the final result
   */
  private normalizeResult(result: any, preliminaryScore: number): FinalScoringResult {
    // Use preliminary score if LLM score is way off
    let finalScore = result.finalScore || preliminaryScore;

    // Ensure score is within bounds
    finalScore = Math.max(0, Math.min(100, finalScore));

    // Validate decision
    let decision = result.decision || 'review';
    if (!['shortlisted', 'rejected', 'review'].includes(decision)) {
      // Determine decision based on score
      if (finalScore >= 75) decision = 'shortlisted';
      else if (finalScore < 60) decision = 'rejected';
      else decision = 'review';
    }

    // Ensure confidence is valid
    let confidence = result.confidence || 75;
    confidence = Math.max(0, Math.min(100, confidence));

    // Ensure arrays exist
    const strengths = Array.isArray(result.strengths) ? result.strengths : [];
    const weaknesses = Array.isArray(result.weaknesses) ? result.weaknesses : [];
    const keyHighlights = Array.isArray(result.keyHighlights) ? result.keyHighlights : [];
    const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
    const interviewSuggestions = Array.isArray(result.interviewSuggestions) ? result.interviewSuggestions : [];
    const riskFactors = Array.isArray(result.riskFactors) ? result.riskFactors : [];

    // Normalize component scores
    const componentScores = {
      skills: Math.max(0, Math.min(100, result.componentScores?.skills || finalScore)),
      experience: Math.max(0, Math.min(100, result.componentScores?.experience || finalScore)),
      education: Math.max(0, Math.min(100, result.componentScores?.education || finalScore)),
      overall: finalScore,
    };

    // Normalize fit analysis
    const fitAnalysis = {
      technical: Math.max(0, Math.min(100, result.fitAnalysis?.technical || finalScore)),
      experience: Math.max(0, Math.min(100, result.fitAnalysis?.experience || finalScore)),
      growth: Math.max(0, Math.min(100, result.fitAnalysis?.growth || finalScore)),
      culture: Math.max(0, Math.min(100, result.fitAnalysis?.culture || 70)),
    };

    return {
      finalScore,
      decision,
      confidence,
      componentScores,
      strengths,
      weaknesses,
      keyHighlights,
      detailedReasoning: result.detailedReasoning || 'No detailed reasoning provided',
      recommendations,
      interviewSuggestions,
      riskFactors,
      fitAnalysis,
    };
  }

  /**
   * Quick decision maker (simplified version)
   */
  public makeQuickDecision(
    skillsScore: number,
    experienceScore: number,
    criticalSkillsMissing: number
  ): { decision: string; score: number } {
    // Calculate simple weighted score
    const score = Math.round(skillsScore * 0.6 + experienceScore * 0.4);

    // Apply penalty for missing critical skills
    const penalizedScore = score - (criticalSkillsMissing * 5);

    // Make decision
    let decision = 'review';
    if (penalizedScore >= 75 && criticalSkillsMissing === 0) {
      decision = 'shortlisted';
    } else if (penalizedScore < 60 || criticalSkillsMissing > 3) {
      decision = 'rejected';
    }

    return { decision, score: Math.max(0, penalizedScore) };
  }
}

export default FinalScoringAgent;
