import { logger } from '../utils/logger.js';
import * as chrono from 'chrono-node';

interface WorkExperience {
  title: string;
  company: string;
  location?: string;
  startDate: Date | null;
  endDate: Date | null;
  duration: string;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

interface ExperienceExtractionResult {
  experiences: WorkExperience[];
  totalYears: number;
  totalMonths: number;
  currentPosition?: WorkExperience;
  mostRecentPosition?: WorkExperience;
  careerProgression: string;
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  hasLeadershipExperience: boolean;
  confidence: number;
}

/**
 * Experience Extractor Agent - Rule-based work experience extraction
 * Extracts job history, dates, responsibilities without using LLM
 */
export class ExperienceExtractorAgent {
  private static readonly TITLE_KEYWORDS = [
    // Software development
    'Software Engineer', 'Developer', 'Programmer', 'Full Stack', 'Frontend', 'Backend',
    'Web Developer', 'Mobile Developer', 'Application Developer',
    // Senior roles
    'Senior', 'Lead', 'Principal', 'Staff', 'Architect', 'Director', 'VP', 'CTO', 'Head of',
    // Management
    'Manager', 'Engineering Manager', 'Technical Manager', 'Project Manager', 'Product Manager',
    // Specialized
    'DevOps', 'SRE', 'Data Engineer', 'Data Scientist', 'ML Engineer', 'Security Engineer',
    'QA', 'Quality Assurance', 'Test Engineer', 'Automation Engineer',
    // Design
    'Designer', 'UX Designer', 'UI Designer', 'Product Designer', 'Graphic Designer',
    // Other
    'Analyst', 'Consultant', 'Specialist', 'Coordinator', 'Administrator',
    'Intern', 'Associate', 'Junior', 'Trainee',
  ];

  private static readonly SECTION_HEADERS = [
    'experience', 'work experience', 'professional experience', 'employment',
    'work history', 'career history', 'professional background',
  ];

  private static readonly DURATION_PATTERNS = [
    /(\d{4})\s*[-–—]\s*(\d{4})/g, // 2020 - 2023
    /(\d{4})\s*[-–—]\s*(present|current|now)/gi, // 2020 - Present
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})\s*[-–—]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})/gi,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})\s*[-–—]\s*(present|current|now)/gi,
  ];

  /**
   * Extract work experience from resume text
   */
  async extractExperience(resumeText: string): Promise<ExperienceExtractionResult> {
    logger.info('Starting rule-based experience extraction...');
    const startTime = Date.now();

    try {
      const experiences = this.extractWorkExperiences(resumeText);
      const totalYears = this.calculateTotalExperience(experiences);
      const totalMonths = Math.round(totalYears * 12);
      const currentPosition = experiences.find(exp => exp.current);
      const mostRecentPosition = experiences[0]; // Already sorted by date
      const careerProgression = this.analyzeCareerProgression(experiences);
      const seniorityLevel = this.detectSeniorityLevel(experiences, totalYears);
      const hasLeadershipExperience = this.detectLeadership(experiences);
      const confidence = this.calculateConfidence(experiences);

      const processingTime = Date.now() - startTime;
      logger.info(
        `Experience extraction completed in ${processingTime}ms. Found ${experiences.length} positions, ${totalYears} years total.`
      );

      return {
        experiences,
        totalYears,
        totalMonths,
        currentPosition,
        mostRecentPosition,
        careerProgression,
        seniorityLevel,
        hasLeadershipExperience,
        confidence,
      };
    } catch (error: any) {
      logger.error('Experience extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Extract individual work experiences from text
   */
  private extractWorkExperiences(text: string): WorkExperience[] {
    const experiences: WorkExperience[] = [];
    const lines = text.split('\n');

    // Find experience section
    const experienceSection = this.findExperienceSection(lines);

    if (!experienceSection) {
      logger.warn('No experience section found in resume');
      return [];
    }

    // Parse experiences from section
    let currentExperience: Partial<WorkExperience> | null = null;
    let descriptionLines: string[] = [];

    for (let i = experienceSection.start; i < experienceSection.end; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // Detect job title
      const titleMatch = this.detectJobTitle(line);
      if (titleMatch) {
        // Save previous experience if exists
        if (currentExperience?.title && currentExperience?.company) {
          currentExperience.description = descriptionLines.join(' ').trim();
          currentExperience.responsibilities = this.extractResponsibilities(descriptionLines);
          currentExperience.achievements = this.extractAchievements(descriptionLines);
          currentExperience.technologies = this.extractTechnologies(descriptionLines);
          experiences.push(currentExperience as WorkExperience);
        }

        // Start new experience
        currentExperience = {
          title: titleMatch.title,
          company: titleMatch.company || '',
          location: titleMatch.location,
          startDate: null,
          endDate: null,
          duration: '',
          current: false,
          description: '',
          responsibilities: [],
          achievements: [],
          technologies: [],
        };
        descriptionLines = [];

        // Try to extract dates from same line or next few lines
        const dateInfo = this.extractDates(line) || this.extractDates(lines.slice(i, i + 3).join(' '));
        if (dateInfo) {
          currentExperience.startDate = dateInfo.startDate;
          currentExperience.endDate = dateInfo.endDate;
          currentExperience.current = dateInfo.current;
          currentExperience.duration = dateInfo.duration;
        }

        continue;
      }

      // Accumulate description lines
      if (currentExperience) {
        descriptionLines.push(line);
      }
    }

    // Save last experience
    if (currentExperience?.title && currentExperience?.company) {
      currentExperience.description = descriptionLines.join(' ').trim();
      currentExperience.responsibilities = this.extractResponsibilities(descriptionLines);
      currentExperience.achievements = this.extractAchievements(descriptionLines);
      currentExperience.technologies = this.extractTechnologies(descriptionLines);
      experiences.push(currentExperience as WorkExperience);
    }

    // Sort by date (most recent first)
    return experiences.sort((a, b) => {
      const dateA = a.endDate || a.startDate || new Date(0);
      const dateB = b.endDate || b.startDate || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Find the experience section in resume
   */
  private findExperienceSection(lines: string[]): { start: number; end: number } | null {
    let start = -1;
    let end = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();

      // Find start of experience section
      if (start === -1) {
        for (const header of ExperienceExtractorAgent.SECTION_HEADERS) {
          if (line === header || line.startsWith(header + ':') || line.startsWith(header + ' ')) {
            start = i + 1;
            break;
          }
        }
      }

      // Find end of experience section (next major section)
      if (start !== -1 && i > start + 3) {
        if (
          line === 'education' ||
          line === 'skills' ||
          line === 'projects' ||
          line === 'certifications' ||
          line === 'awards' ||
          line === 'publications'
        ) {
          end = i;
          break;
        }
      }
    }

    if (start === -1) {
      return null;
    }

    return { start, end };
  }

  /**
   * Detect job title and company from line
   */
  private detectJobTitle(line: string): {
    title: string;
    company?: string;
    location?: string;
  } | null {
    // Pattern: "Job Title at Company" or "Job Title | Company" or "Job Title, Company"
    const patterns = [
      /^(.+?)\s+at\s+(.+?)(?:\s*[,|]\s*(.+))?$/i,
      /^(.+?)\s*\|\s*(.+?)(?:\s*[,|]\s*(.+))?$/i,
      /^(.+?),\s+(.+?)(?:,\s*(.+))?$/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const title = match[1].trim();
        const company = match[2]?.trim();
        const location = match[3]?.trim();

        // Verify title contains job keywords
        if (this.containsJobKeyword(title)) {
          return { title, company, location };
        }
      }
    }

    // Check if line itself is a job title
    if (this.containsJobKeyword(line)) {
      return { title: line.trim() };
    }

    return null;
  }

  /**
   * Check if text contains job title keywords
   */
  private containsJobKeyword(text: string): boolean {
    const lowerText = text.toLowerCase();
    return ExperienceExtractorAgent.TITLE_KEYWORDS.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Extract dates from text
   */
  private extractDates(text: string): {
    startDate: Date | null;
    endDate: Date | null;
    current: boolean;
    duration: string;
  } | null {
    const lowerText = text.toLowerCase();
    const isCurrent = lowerText.includes('present') || lowerText.includes('current') || lowerText.includes('now');

    // Try to parse dates using chrono-node
    const dates = chrono.parse(text);

    if (dates.length >= 1) {
      const startDate = dates[0].start.date();
      const endDate = isCurrent ? null : (dates[1]?.start.date() || null);

      const duration = this.calculateDuration(startDate, endDate);

      return {
        startDate,
        endDate,
        current: isCurrent,
        duration,
      };
    }

    // Fallback: Try manual pattern matching
    for (const pattern of ExperienceExtractorAgent.DURATION_PATTERNS) {
      const match = pattern.exec(text);
      if (match) {
        const startYear = parseInt(match[1], 10);
        const endYear = match[2] && !isNaN(parseInt(match[2], 10))
          ? parseInt(match[2], 10)
          : new Date().getFullYear();

        const startDate = new Date(startYear, 0, 1);
        const endDate = isCurrent ? null : new Date(endYear, 11, 31);

        const duration = this.calculateDuration(startDate, endDate);

        return {
          startDate,
          endDate,
          current: isCurrent,
          duration,
        };
      }
    }

    return null;
  }

  /**
   * Calculate duration between two dates
   */
  private calculateDuration(startDate: Date, endDate: Date | null): string {
    const end = endDate || new Date();
    const months = this.monthsDifference(startDate, end);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Calculate months between two dates
   */
  private monthsDifference(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())
    );
  }

  /**
   * Extract responsibilities from description lines
   */
  private extractResponsibilities(lines: string[]): string[] {
    const responsibilities: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Lines starting with bullet points or action verbs
      if (
        trimmed.startsWith('•') ||
        trimmed.startsWith('-') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('→') ||
        this.startsWithActionVerb(trimmed)
      ) {
        responsibilities.push(trimmed.replace(/^[•\-*→]\s*/, '').trim());
      }
    }

    return responsibilities.slice(0, 5); // Limit to top 5
  }

  /**
   * Extract achievements from description
   */
  private extractAchievements(lines: string[]): string[] {
    const achievements: string[] = [];
    const achievementKeywords = ['achieved', 'improved', 'increased', 'reduced', 'delivered', 'led', 'launched'];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      // Lines with achievement indicators or numbers
      if (
        achievementKeywords.some(keyword => lowerLine.includes(keyword)) ||
        /\d+%/.test(line) || // Contains percentages
        /\$[\d,]+/.test(line) // Contains dollar amounts
      ) {
        achievements.push(line.trim().replace(/^[•\-*→]\s*/, ''));
      }
    }

    return achievements.slice(0, 3); // Limit to top 3
  }

  /**
   * Extract technologies mentioned in description
   */
  private extractTechnologies(lines: string[]): string[] {
    const technologies: Set<string> = new Set();
    const text = lines.join(' ');

    // Look for "Technologies:" or "Tech Stack:" sections
    const techPatterns = [
      /technologies?:?\s*([^\n.]+)/gi,
      /tech stack:?\s*([^\n.]+)/gi,
      /tools?:?\s*([^\n.]+)/gi,
    ];

    for (const pattern of techPatterns) {
      const match = pattern.exec(text);
      if (match) {
        const techs = match[1].split(/[,;]/);
        techs.forEach(tech => technologies.add(tech.trim()));
      }
    }

    return Array.from(technologies).slice(0, 10);
  }

  /**
   * Check if text starts with an action verb
   */
  private startsWithActionVerb(text: string): boolean {
    const actionVerbs = [
      'developed', 'built', 'created', 'designed', 'implemented', 'managed',
      'led', 'coordinated', 'improved', 'optimized', 'delivered', 'achieved',
      'collaborated', 'maintained', 'deployed', 'integrated', 'tested', 'debugged',
    ];

    const firstWord = text.toLowerCase().split(' ')[0];
    return actionVerbs.includes(firstWord);
  }

  /**
   * Calculate total years of experience
   */
  private calculateTotalExperience(experiences: WorkExperience[]): number {
    let totalMonths = 0;

    for (const exp of experiences) {
      if (exp.startDate) {
        const end = exp.endDate || new Date();
        totalMonths += this.monthsDifference(exp.startDate, end);
      }
    }

    return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Analyze career progression
   */
  private analyzeCareerProgression(experiences: WorkExperience[]): string {
    if (experiences.length === 0) return 'No experience data';
    if (experiences.length === 1) return 'Single position';

    const titles = experiences.map(exp => exp.title.toLowerCase());

    // Check for progression keywords
    const hasProgression =
      (titles.some(t => t.includes('junior')) && titles.some(t => t.includes('senior'))) ||
      (titles.some(t => t.includes('developer')) && titles.some(t => t.includes('lead'))) ||
      (titles.some(t => t.includes('engineer')) && titles.some(t => t.includes('architect')));

    if (hasProgression) {
      return 'Clear upward progression';
    }

    return 'Steady career growth';
  }

  /**
   * Detect seniority level
   */
  private detectSeniorityLevel(
    experiences: WorkExperience[],
    totalYears: number
  ): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' {
    if (experiences.length === 0) return 'entry';

    const mostRecentTitle = experiences[0].title.toLowerCase();

    // Check title keywords first
    if (mostRecentTitle.includes('cto') || mostRecentTitle.includes('vp') || mostRecentTitle.includes('director')) {
      return 'executive';
    }

    if (mostRecentTitle.includes('lead') || mostRecentTitle.includes('principal') || mostRecentTitle.includes('architect')) {
      return 'lead';
    }

    if (mostRecentTitle.includes('senior') || mostRecentTitle.includes('staff')) {
      return 'senior';
    }

    if (mostRecentTitle.includes('junior') || mostRecentTitle.includes('associate') || mostRecentTitle.includes('intern')) {
      return 'entry';
    }

    // Fallback to years of experience
    if (totalYears >= 10) return 'lead';
    if (totalYears >= 5) return 'senior';
    if (totalYears >= 2) return 'mid';
    return 'entry';
  }

  /**
   * Detect leadership experience
   */
  private detectLeadership(experiences: WorkExperience[]): boolean {
    const leadershipKeywords = [
      'lead', 'led', 'manager', 'director', 'head of', 'mentored', 'managed team',
      'team lead', 'supervised', 'coordinated team', 'reporting to me',
    ];

    for (const exp of experiences) {
      const text = `${exp.title} ${exp.description} ${exp.responsibilities.join(' ')}`.toLowerCase();
      if (leadershipKeywords.some(keyword => text.includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(experiences: WorkExperience[]): number {
    if (experiences.length === 0) return 0;

    let score = 50; // Base score

    // More positions = higher confidence
    score += Math.min(experiences.length * 10, 30);

    // Has dates = higher confidence
    const withDates = experiences.filter(exp => exp.startDate).length;
    score += (withDates / experiences.length) * 20;

    return Math.min(score, 100);
  }
}

export default ExperienceExtractorAgent;
