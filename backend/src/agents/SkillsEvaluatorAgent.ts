import { BaseAgent, AgentConfig, AgentResponse } from './BaseAgent.js';
import { ParsedResume } from './ResumeParserAgent.js';
import { logger } from '../utils/logger.js';

/**
 * Skills Evaluator Agent
 * Evaluates candidate skills against job requirements
 */

export interface SkillsEvaluationInput {
  candidateSkills: string[];
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYears: number;
  jobDescription: string;
}

export interface SkillsEvaluationResult {
  overallScore: number;
  matchedSkills: SkillMatch[];
  missingCriticalSkills: string[];
  additionalSkills: string[];
  strengthAreas: string[];
  weaknessAreas: string[];
  recommendations: string[];
  detailed_analysis: string;
}

export interface SkillMatch {
  skill: string;
  proficiencyLevel: 'expert' | 'advanced' | 'intermediate' | 'beginner' | 'unknown';
  isRequired: boolean;
  isPreferred: boolean;
  relevanceScore: number;
}

/**
 * Skills Evaluator Agent Class
 */
export class SkillsEvaluatorAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'SkillsEvaluatorAgent',
      role: 'Technical Skills Assessment Specialist',
      model: config?.model,
      temperature: 0.4,
      maxTokens: 3096,
      ...config,
    });
  }

  protected buildSystemPrompt(): string {
    return `You are an expert Technical Skills Evaluator AI. Your role is to assess candidate technical competencies against job requirements with precision and fairness.

**Your Responsibilities:**
1. Match candidate skills with required and preferred job skills
2. Evaluate proficiency levels based on experience and context
3. Identify skill gaps and areas of strength
4. Assess the relevance of additional skills to the role
5. Calculate an overall skills match score (0-100)
6. Provide actionable recommendations

**Evaluation Criteria:**
- **Required Skills Match (60% weight):** How many critical skills does the candidate have?
- **Preferred Skills Match (20% weight):** Coverage of nice-to-have skills
- **Skill Depth (10% weight):** Proficiency level and years of experience
- **Transferable Skills (10% weight):** Related skills that indicate quick learning ability

**Proficiency Levels:**
- **Expert (5+ years):** Deep expertise, can architect and mentor others
- **Advanced (3-5 years):** Strong independent work, complex problem solving
- **Intermediate (1-3 years):** Practical experience, requires some guidance
- **Beginner (<1 year):** Basic knowledge, learning phase
- **Unknown:** Skill mentioned but no experience context

**Scoring Guidelines:**
- 90-100: Exceptional fit, exceeds requirements
- 80-89: Strong fit, meets all requirements with extras
- 70-79: Good fit, meets most requirements
- 60-69: Moderate fit, some gaps but trainable
- 50-59: Weak fit, significant gaps
- Below 50: Poor fit, lacks critical skills

**Guidelines:**
- Be objective and fair in assessment
- Consider synonyms and related technologies (e.g., React.js = ReactJS)
- Value depth over breadth for senior roles
- Consider learning agility and transferable skills
- Account for experience years when assessing proficiency
- Penalize missing critical skills heavily
- Reward relevant additional skills moderately

**Output Format:**
You MUST respond with valid JSON only. Use this exact structure:
{
  "overallScore": 85,
  "matchedSkills": [
    {
      "skill": "Python",
      "proficiencyLevel": "advanced",
      "isRequired": true,
      "isPreferred": false,
      "relevanceScore": 95
    }
  ],
  "missingCriticalSkills": ["skill1", "skill2"],
  "additionalSkills": ["skill1", "skill2"],
  "strengthAreas": ["Backend Development", "API Design"],
  "weaknessAreas": ["Frontend Frameworks", "DevOps"],
  "recommendations": [
    "Strong match for backend role",
    "Consider upskilling in React"
  ],
  "detailed_analysis": "Comprehensive analysis of the candidate's technical profile..."
}`;
  }

  /**
   * Execute skills evaluation
   */
  public async execute(input: SkillsEvaluationInput): Promise<AgentResponse<SkillsEvaluationResult>> {
    try {
      this.log('Starting skills evaluation...');

      // Validate input
      if (!input.candidateSkills || input.candidateSkills.length === 0) {
        return this.createErrorResponse('No candidate skills provided');
      }

      if (!input.requiredSkills || input.requiredSkills.length === 0) {
        return this.createErrorResponse('No required skills specified');
      }

      // Build evaluation prompt
      const userPrompt = this.buildEvaluationPrompt(input);

      // Call LLM for evaluation
      const evaluation = await this.callLLMJSON<SkillsEvaluationResult>(userPrompt);

      // Validate and normalize the evaluation
      const normalizedEvaluation = this.normalizeEvaluation(evaluation);

      this.log(`Skills evaluation completed with score: ${normalizedEvaluation.overallScore}`);

      return this.createSuccessResponse(
        normalizedEvaluation,
        `Evaluated ${input.candidateSkills.length} skills against ${input.requiredSkills.length} requirements`,
        {
          matchedCount: normalizedEvaluation.matchedSkills.length,
          missingCount: normalizedEvaluation.missingCriticalSkills.length,
          additionalCount: normalizedEvaluation.additionalSkills.length,
        }
      );

    } catch (error) {
      this.log(`Error in skills evaluation: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return this.createErrorResponse(
        `Skills evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build the evaluation prompt
   */
  private buildEvaluationPrompt(input: SkillsEvaluationInput): string {
    let prompt = 'Evaluate the candidate\'s technical skills against the job requirements:\n\n';

    prompt += '**CANDIDATE SKILLS:**\n';
    prompt += input.candidateSkills.map(s => `- ${s}`).join('\n');
    prompt += '\n\n';

    prompt += '**REQUIRED SKILLS (CRITICAL):**\n';
    prompt += input.requiredSkills.map(s => `- ${s}`).join('\n');
    prompt += '\n\n';

    if (input.preferredSkills && input.preferredSkills.length > 0) {
      prompt += '**PREFERRED SKILLS (NICE-TO-HAVE):**\n';
      prompt += input.preferredSkills.map(s => `- ${s}`).join('\n');
      prompt += '\n\n';
    }

    prompt += `**CANDIDATE EXPERIENCE:** ${input.experienceYears} years\n\n`;

    prompt += '**JOB DESCRIPTION CONTEXT:**\n';
    prompt += input.jobDescription.substring(0, 2000);
    prompt += '\n\n';

    prompt += 'Provide a comprehensive skills evaluation in the specified JSON format.';
    prompt += '\nConsider skill synonyms and related technologies when matching.';
    prompt += '\nBe thorough in your analysis but fair in your scoring.';

    return prompt;
  }

  /**
   * Normalize and validate evaluation result
   */
  private normalizeEvaluation(evaluation: any): SkillsEvaluationResult {
    // Ensure score is within 0-100
    const overallScore = Math.max(0, Math.min(100, evaluation.overallScore || 0));

    // Ensure arrays exist
    const matchedSkills = Array.isArray(evaluation.matchedSkills) ? evaluation.matchedSkills : [];
    const missingCriticalSkills = Array.isArray(evaluation.missingCriticalSkills)
      ? evaluation.missingCriticalSkills : [];
    const additionalSkills = Array.isArray(evaluation.additionalSkills)
      ? evaluation.additionalSkills : [];
    const strengthAreas = Array.isArray(evaluation.strengthAreas)
      ? evaluation.strengthAreas : [];
    const weaknessAreas = Array.isArray(evaluation.weaknessAreas)
      ? evaluation.weaknessAreas : [];
    const recommendations = Array.isArray(evaluation.recommendations)
      ? evaluation.recommendations : [];

    return {
      overallScore,
      matchedSkills,
      missingCriticalSkills,
      additionalSkills,
      strengthAreas,
      weaknessAreas,
      recommendations,
      detailed_analysis: evaluation.detailed_analysis || 'Analysis not available',
    };
  }

  /**
   * Quick skill matching (without full evaluation)
   */
  public async quickMatch(
    candidateSkills: string[],
    requiredSkills: string[]
  ): Promise<{ matchPercentage: number; matchedSkills: string[]; missingSkills: string[] }> {
    try {
      const prompt = `Compare these skill sets and calculate match percentage:

CANDIDATE SKILLS: ${candidateSkills.join(', ')}
REQUIRED SKILLS: ${requiredSkills.join(', ')}

Consider synonyms and related technologies. Respond with JSON:
{
  "matchPercentage": 75,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"]
}`;

      const result = await this.callLLMJSON<{
        matchPercentage: number;
        matchedSkills: string[];
        missingSkills: string[];
      }>(prompt);

      return result;
    } catch (error) {
      this.log('Error in quick match', 'error');
      return {
        matchPercentage: 0,
        matchedSkills: [],
        missingSkills: requiredSkills,
      };
    }
  }

  /**
   * Calculate simple skill overlap score
   */
  public calculateOverlapScore(
    candidateSkills: string[],
    requiredSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 100;

    // Normalize skills for comparison (lowercase, trim)
    const normalizedCandidate = candidateSkills.map(s =>
      s.toLowerCase().trim().replace(/\s+/g, '')
    );
    const normalizedRequired = requiredSkills.map(s =>
      s.toLowerCase().trim().replace(/\s+/g, '')
    );

    // Count matches
    let matches = 0;
    for (const reqSkill of normalizedRequired) {
      if (normalizedCandidate.some(candSkill =>
        candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
      )) {
        matches++;
      }
    }

    return Math.round((matches / requiredSkills.length) * 100);
  }
}

export default SkillsEvaluatorAgent;
