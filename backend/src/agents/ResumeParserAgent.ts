import { BaseAgent, AgentConfig, AgentResponse } from "./BaseAgent.js";
import { logger } from "../utils/logger.js";
import { truncateToTokenLimit, estimateTokens } from "../config/groq.js";

/**
 * Resume Parser Agent
 * Extracts structured information from resume text
 */

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  summary?: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  languages: string[];
  totalExperienceYears: number;
  keyHighlights: string[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  field?: string;
}

export interface ResumeParserInput {
  resumeText: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
}

/**
 * Resume Parser Agent Class
 */
export class ResumeParserAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "ResumeParserAgent",
      role: "Resume Information Extraction Specialist",
      model: config?.model,
      temperature: 0.3, // Low temperature for consistent extraction
      maxTokens: 4096,
      ...config,
    });
  }

  protected buildSystemPrompt(): string {
    return `You are an expert Resume Parser AI. Your role is to extract structured information from resume text with high accuracy.

**Your Responsibilities:**
1. Extract contact information (name, email, phone)
2. Identify and list ALL technical skills, tools, and technologies
3. Parse work experience with job titles, companies, and durations
4. Extract education details
5. Identify certifications and licenses
6. List spoken languages
7. Calculate total years of experience
8. Summarize key career highlights

**CRITICAL: Skills Extraction**
- Extract EVERY skill mentioned in the resume
- Include programming languages, frameworks, libraries, tools, platforms, methodologies
- Include both technical and soft skills
- Look in ALL sections: skills, experience, projects, summary
- Return AT LEAST 5-10 skills for most resumes

**Guidelines:**
- Be thorough and accurate in extraction
- Normalize data formats (e.g., phone numbers, dates)
- If information is missing or unclear, indicate it as null or empty
- Extract ALL skills mentioned, including technical and soft skills
- For experience calculation, sum up all work durations
- Use exact text from resume when possible
- If data is ambiguous, make your best inference

**Output Format:**
You MUST respond with valid JSON only, no additional text. Use this exact structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "summary": "Brief professional summary",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Dec 2022",
      "description": "Job description and achievements",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "2020",
      "field": "Field of Study"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "languages": ["English", "Spanish"],
  "totalExperienceYears": 5,
  "keyHighlights": ["highlight1", "highlight2"]
}`;
  }

  /**
   * Execute resume parsing
   */
  public async execute(
    input: ResumeParserInput,
  ): Promise<AgentResponse<ParsedResume>> {
    try {
      this.log("Starting resume parsing...");

      if (!input.resumeText || input.resumeText.trim().length < 50) {
        return this.createErrorResponse("Resume text is too short or empty");
      }

      // Truncate resume text if too large
      const originalLength = input.resumeText.length;
      const truncatedResumeText = truncateToTokenLimit(input.resumeText, 3000); // ~3000 tokens for resume text

      if (truncatedResumeText.length < originalLength) {
        this.log(
          `Resume text truncated from ${originalLength} to ${truncatedResumeText.length} characters`,
          "warn",
        );
      }

      // Build the parsing prompt with truncated text
      const inputWithTruncatedText = {
        ...input,
        resumeText: truncatedResumeText,
      };
      const userPrompt = this.buildParsingPrompt(inputWithTruncatedText);

      // Verify total prompt size
      const totalTokens = estimateTokens(this.systemPrompt + userPrompt);
      this.log(`Estimated tokens: ${totalTokens}`);

      if (totalTokens > 5000) {
        this.log(
          `Warning: Prompt may be too large (${totalTokens} tokens)`,
          "warn",
        );
      }

      // Call LLM for JSON parsing
      const parsed = await this.callLLMJSON<ParsedResume>(userPrompt);

      // Validate and enrich parsed data
      const enrichedData = this.enrichParsedData(parsed, input);

      // CRITICAL FIX: If no skills were extracted, try fallback extraction
      if (!enrichedData.skills || enrichedData.skills.length === 0) {
        this.log(
          "No skills found in initial parse, attempting fallback extraction...",
          "warn",
        );
        const fallbackSkills =
          await this.extractSkillsWithFallback(truncatedResumeText);
        enrichedData.skills = fallbackSkills;
        this.log(`Fallback extraction found ${fallbackSkills.length} skills`);
      }

      // Validate that we have at least some skills
      if (enrichedData.skills.length === 0) {
        this.log("WARNING: No skills could be extracted from resume", "warn");
      }

      this.log(`Successfully parsed resume for: ${enrichedData.name}`);

      return this.createSuccessResponse(
        enrichedData,
        "Resume parsed successfully",
        {
          skillCount: enrichedData.skills.length,
          experienceCount: enrichedData.experience.length,
          educationCount: enrichedData.education.length,
        },
      );
    } catch (error) {
      this.log(
        `Error parsing resume: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error",
      );
      return this.createErrorResponse(
        `Failed to parse resume: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Build the parsing prompt with resume text
   */
  private buildParsingPrompt(input: ResumeParserInput): string {
    let prompt =
      "Parse the following resume and extract all information in the specified JSON format.\n\n";

    prompt +=
      "IMPORTANT: Make sure to extract ALL skills from the resume. Look carefully in every section.\n\n";

    // Limit additional context
    prompt += "---RESUME TEXT---\n";
    prompt += input.resumeText;
    prompt += "\n---END RESUME---\n\n";

    if (input.candidateName) {
      prompt += `\nNote: Candidate name is: ${input.candidateName}\n`;
    }
    if (input.candidateEmail) {
      prompt += `Note: Candidate email is: ${input.candidateEmail}\n`;
    }
    if (input.candidatePhone) {
      prompt += `Note: Candidate phone is: ${input.candidatePhone}\n`;
    }

    prompt += "\nProvide your response as valid JSON only.";

    return prompt;
  }

  /**
   * Enrich and validate parsed data
   */
  private enrichParsedData(
    parsed: any,
    input: ResumeParserInput,
  ): ParsedResume {
    // Use provided candidate info if parsed data is missing
    const name = parsed.name || input.candidateName || "Unknown";
    const email = parsed.email || input.candidateEmail || "";
    const phone = parsed.phone || input.candidatePhone || "";

    // Ensure arrays are properly formatted
    const skills = Array.isArray(parsed.skills) ? parsed.skills : [];
    const experience = Array.isArray(parsed.experience)
      ? parsed.experience
      : [];
    const education = Array.isArray(parsed.education) ? parsed.education : [];
    const certifications = Array.isArray(parsed.certifications)
      ? parsed.certifications
      : [];
    const languages = Array.isArray(parsed.languages) ? parsed.languages : [];
    const keyHighlights = Array.isArray(parsed.keyHighlights)
      ? parsed.keyHighlights
      : [];

    // Deduplicate skills (case-insensitive)
    const uniqueSkills: string[] = [
      ...new Set<string>(
        skills.map((s: string) => s.trim()).filter((s: string) => s.length > 0),
      ),
    ];

    // Calculate total experience if not provided
    let totalExperienceYears = parsed.totalExperienceYears || 0;
    if (totalExperienceYears === 0 && experience.length > 0) {
      totalExperienceYears = this.calculateTotalExperience(experience);
    }

    return {
      name,
      email,
      phone,
      summary: parsed.summary || "",
      skills: uniqueSkills,
      experience,
      education,
      certifications,
      languages,
      totalExperienceYears,
      keyHighlights,
    };
  }

  /**
   * Calculate total years of experience from experience entries
   */
  private calculateTotalExperience(experience: ExperienceEntry[]): number {
    try {
      let totalMonths = 0;

      for (const exp of experience) {
        const months = this.parseDuration(exp.duration);
        totalMonths += months;
      }

      return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal
    } catch (error) {
      this.log("Error calculating experience duration", "warn");
      return 0;
    }
  }

  /**
   * Parse duration string to months
   */
  private parseDuration(duration: string): number {
    try {
      // Handle "Present" or "Current"
      const normalizedDuration = duration
        .toLowerCase()
        .replace(/present|current|now/g, new Date().getFullYear().toString());

      // Extract years from duration string
      const yearMatches = normalizedDuration.match(/\d{4}/g);

      if (yearMatches && yearMatches.length >= 2) {
        const startYear = parseInt(yearMatches[0]);
        const endYear = parseInt(yearMatches[yearMatches.length - 1]);
        return (endYear - startYear) * 12;
      }

      // Try to find explicit year counts like "3 years"
      const yearsMatch = duration.match(/(\d+)\s*(year|yr)/i);
      if (yearsMatch) {
        return parseInt(yearsMatch[1]) * 12;
      }

      // Default to 12 months if we can't parse
      return 12;
    } catch (error) {
      return 12; // Default to 1 year
    }
  }

  /**
   * Extract skills with fallback methods (LLM + Regex)
   */
  private async extractSkillsWithFallback(
    resumeText: string,
  ): Promise<string[]> {
    try {
      // Try LLM extraction first
      const llmSkills = await this.extractSkillsOnly(resumeText);
      if (llmSkills.length > 0) {
        this.log(`LLM fallback found ${llmSkills.length} skills`);
        return llmSkills;
      }

      // Fallback to regex-based extraction
      this.log(
        "LLM skill extraction returned no results, using regex fallback",
        "warn",
      );
      return this.extractSkillsWithRegex(resumeText);
    } catch (error) {
      this.log("Fallback skill extraction failed, using regex", "warn");
      return this.extractSkillsWithRegex(resumeText);
    }
  }

  /**
   * Extract skills from resume text (LLM method)
   */
  public async extractSkillsOnly(resumeText: string): Promise<string[]> {
    try {
      const truncatedText = truncateToTokenLimit(resumeText, 2000);
      const prompt = `Extract ALL technical skills, tools, technologies, programming languages, frameworks, platforms, and methodologies from this resume.

Look in ALL sections: skills section, experience descriptions, project descriptions, summary.

Resume:
${truncatedText}

Respond with ONLY a JSON array of skills: ["skill1", "skill2", "skill3", ...]

Extract at least 10 skills if they exist in the resume.`;

      const response = await this.callLLMJSON<string[]>(prompt);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      this.log("Error extracting skills with LLM", "error");
      return [];
    }
  }

  /**
   * Extract skills using regex patterns (fallback method)
   */
  private extractSkillsWithRegex(resumeText: string): string[] {
    const skills = new Set<string>();

    // Common technical skills patterns
    const technicalSkills = [
      // Programming Languages
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C\\+\\+",
      "C#",
      "Ruby",
      "PHP",
      "Go",
      "Rust",
      "Swift",
      "Kotlin",
      "Scala",
      "R",
      "MATLAB",
      "Perl",
      "Shell",
      "Bash",
      "PowerShell",
      "SQL",
      "HTML",
      "CSS",
      "Dart",
      // Frontend
      "React",
      "Vue",
      "Angular",
      "Next\\.js",
      "Nuxt",
      "Redux",
      "jQuery",
      "Bootstrap",
      "Tailwind",
      "Material-UI",
      "Webpack",
      "Vite",
      "Sass",
      "LESS",
      "Svelte",
      // Backend
      "Node\\.js",
      "Express",
      "Django",
      "Flask",
      "FastAPI",
      "Spring",
      "ASP\\.NET",
      "Ruby on Rails",
      "Laravel",
      "Symfony",
      "NestJS",
      "Koa",
      "Hapi",
      // Databases
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "Elasticsearch",
      "SQLite",
      "Oracle",
      "SQL Server",
      "DynamoDB",
      "Cassandra",
      "Neo4j",
      "Firebase",
      "MariaDB",
      "CouchDB",
      // Cloud & DevOps
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "GitLab CI",
      "GitHub Actions",
      "Terraform",
      "Ansible",
      "CircleCI",
      "Travis CI",
      "Heroku",
      "Vercel",
      "Netlify",
      // Tools & Others
      "Git",
      "Linux",
      "Nginx",
      "Apache",
      "REST API",
      "GraphQL",
      "gRPC",
      "Microservices",
      "CI/CD",
      "Agile",
      "Scrum",
      "Jira",
      "Confluence",
      "Postman",
      "Swagger",
      // Mobile
      "React Native",
      "Flutter",
      "iOS",
      "Android",
      "Xamarin",
      "Ionic",
      // Data Science / ML / AI
      "TensorFlow",
      "PyTorch",
      "Scikit-learn",
      "Pandas",
      "NumPy",
      "Jupyter",
      "Keras",
      "Machine Learning",
      "Deep Learning",
      "NLP",
      "Computer Vision",
      "Data Science",
      "Artificial Intelligence",
      "Neural Networks",
      // Testing
      "Jest",
      "Mocha",
      "Pytest",
      "JUnit",
      "Selenium",
      "Cypress",
      "TestNG",
      "Jasmine",
      // Other
      "Figma",
      "Adobe XD",
      "Photoshop",
      "Illustrator",
      "Sketch",
    ];

    // Search for each skill (case-insensitive)
    for (const skill of technicalSkills) {
      const regex = new RegExp(`\\b${skill}\\b`, "gi");
      if (regex.test(resumeText)) {
        // Preserve original casing from skill list
        skills.add(skill.replace(/\\b/g, "").replace(/\\\./g, "."));
      }
    }

    // Extract skills from common section headers
    const skillSectionRegex =
      /(?:skills?|technologies|technical\s+skills?|expertise|competencies|tools)[:\s]*([^\n]+(?:\n(?!\n)[^\n]+)*)/gi;
    let match;
    while ((match = skillSectionRegex.exec(resumeText)) !== null) {
      const skillsText = match[1];
      // Split by common delimiters
      const extractedSkills = skillsText
        .split(/[,|•·\n\t;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2 && s.length < 30 && !s.match(/^\d+$/));

      extractedSkills.forEach((skill) => skills.add(skill));
    }

    const skillsArray = Array.from(skills);
    this.log(`Regex extraction found ${skillsArray.length} skills`, "info");
    return skillsArray;
  }
}

export default ResumeParserAgent;
