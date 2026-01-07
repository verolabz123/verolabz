import { logger } from '../utils/logger.js';

interface SkillMatch {
  skill: string;
  category: string;
  proficiency?: string;
  yearsOfExperience?: number;
  matchedContext?: string;
}

interface SkillsExtractionResult {
  technicalSkills: SkillMatch[];
  softSkills: SkillMatch[];
  tools: SkillMatch[];
  languages: SkillMatch[];
  frameworks: SkillMatch[];
  databases: SkillMatch[];
  cloudPlatforms: SkillMatch[];
  certifications: string[];
  allSkills: string[];
  confidence: number;
}

/**
 * Skills Extractor Agent - Rule-based skill extraction from resumes
 * Minimizes LLM usage by using pattern matching and skill databases
 */
export class SkillsExtractorAgent {
  // Comprehensive skill databases
  private static readonly PROGRAMMING_LANGUAGES = [
    // Popular languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'C', 'Ruby', 'PHP', 'Swift',
    'Kotlin', 'Go', 'Rust', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart', 'Objective-C',
    // Web languages
    'HTML', 'HTML5', 'CSS', 'CSS3', 'SASS', 'SCSS', 'LESS',
    // Scripting
    'Bash', 'Shell', 'PowerShell', 'VBScript',
    // Database query languages
    'SQL', 'PL/SQL', 'T-SQL', 'GraphQL',
  ];

  private static readonly FRAMEWORKS_LIBRARIES = [
    // Frontend frameworks
    'React', 'ReactJS', 'React.js', 'Angular', 'AngularJS', 'Vue', 'Vue.js', 'VueJS',
    'Svelte', 'Next.js', 'NextJS', 'Nuxt.js', 'Gatsby', 'Ember.js',
    // Backend frameworks
    'Node.js', 'NodeJS', 'Express', 'Express.js', 'NestJS', 'Fastify', 'Koa',
    'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel', 'Rails',
    'Ruby on Rails', 'ASP.NET', '.NET', '.NET Core', 'Gin', 'Echo',
    // Mobile frameworks
    'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Cordova',
    // Testing frameworks
    'Jest', 'Mocha', 'Chai', 'Jasmine', 'Cypress', 'Selenium', 'Puppeteer',
    'Playwright', 'JUnit', 'pytest', 'RSpec', 'TestNG',
    // State management
    'Redux', 'MobX', 'Vuex', 'Pinia', 'Zustand', 'Recoil',
    // UI libraries
    'Material-UI', 'MUI', 'Ant Design', 'Bootstrap', 'Tailwind CSS', 'Chakra UI',
    'Styled Components', 'Emotion',
  ];

  private static readonly DATABASES = [
    // Relational databases
    'PostgreSQL', 'MySQL', 'MariaDB', 'Oracle', 'SQL Server', 'SQLite',
    // NoSQL databases
    'MongoDB', 'Redis', 'Cassandra', 'Couchbase', 'DynamoDB', 'CouchDB',
    'ElasticSearch', 'Elasticsearch', 'Neo4j',
    // Data warehouses
    'Snowflake', 'BigQuery', 'Redshift',
    // Time-series
    'InfluxDB', 'TimescaleDB',
  ];

  private static readonly CLOUD_PLATFORMS = [
    // Major cloud providers
    'AWS', 'Amazon Web Services', 'Azure', 'Microsoft Azure', 'GCP', 'Google Cloud',
    'Google Cloud Platform', 'IBM Cloud', 'Oracle Cloud', 'Alibaba Cloud',
    // Cloud services
    'EC2', 'S3', 'Lambda', 'CloudFront', 'RDS', 'DynamoDB', 'ECS', 'EKS',
    'Cloud Functions', 'Cloud Run', 'Cloud Storage', 'App Engine',
    'Azure Functions', 'Azure Storage', 'Azure DevOps',
    // Serverless
    'Serverless', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean',
  ];

  private static readonly DEVOPS_TOOLS = [
    // Containerization
    'Docker', 'Kubernetes', 'K8s', 'Docker Compose', 'Podman',
    // CI/CD
    'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
    'Azure Pipelines', 'Bamboo', 'TeamCity', 'ArgoCD',
    // IaC
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'CloudFormation',
    // Monitoring
    'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Splunk', 'ELK Stack',
    'Kibana', 'Logstash',
    // Version control
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
  ];

  private static readonly DESIGN_TOOLS = [
    'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Zeplin', 'Photoshop',
    'Illustrator', 'After Effects', 'Premiere Pro',
  ];

  private static readonly DATA_SCIENCE_TOOLS = [
    // ML/AI frameworks
    'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'scikit-learn',
    'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn',
    // Big data
    'Hadoop', 'Spark', 'Kafka', 'Airflow', 'Flink',
    // Jupyter
    'Jupyter', 'JupyterLab', 'Jupyter Notebook',
  ];

  private static readonly SOFT_SKILLS = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
    'Critical Thinking', 'Time Management', 'Adaptability', 'Collaboration',
    'Project Management', 'Agile', 'Scrum', 'Mentoring', 'Team Lead',
    'Public Speaking', 'Presentation', 'Writing', 'Documentation',
    'Stakeholder Management', 'Client Relations', 'Negotiation',
  ];

  private static readonly CERTIFICATIONS_KEYWORDS = [
    'AWS Certified', 'Azure Certified', 'Google Cloud Certified',
    'Certified Kubernetes', 'CKA', 'CKAD', 'CKS',
    'PMP', 'Scrum Master', 'CSM', 'CSPO', 'SAFe',
    'CISSP', 'CompTIA', 'Security+', 'Network+',
    'Oracle Certified', 'Microsoft Certified', 'Cisco Certified',
    'Red Hat Certified', 'RHCSA', 'RHCE',
  ];

  /**
   * Extract skills from resume text using rule-based approach
   */
  async extractSkills(resumeText: string): Promise<SkillsExtractionResult> {
    logger.info('Starting rule-based skills extraction...');
    const startTime = Date.now();

    try {
      const normalizedText = this.normalizeText(resumeText);

      // Extract different categories of skills
      const technicalSkills = this.extractCategory(
        normalizedText,
        [...SkillsExtractorAgent.PROGRAMMING_LANGUAGES],
        'programming_language'
      );

      const frameworks = this.extractCategory(
        normalizedText,
        SkillsExtractorAgent.FRAMEWORKS_LIBRARIES,
        'framework'
      );

      const databases = this.extractCategory(
        normalizedText,
        SkillsExtractorAgent.DATABASES,
        'database'
      );

      const cloudPlatforms = this.extractCategory(
        normalizedText,
        SkillsExtractorAgent.CLOUD_PLATFORMS,
        'cloud'
      );

      const tools = this.extractCategory(
        normalizedText,
        [...SkillsExtractorAgent.DEVOPS_TOOLS, ...SkillsExtractorAgent.DESIGN_TOOLS],
        'tool'
      );

      const softSkills = this.extractCategory(
        normalizedText,
        SkillsExtractorAgent.SOFT_SKILLS,
        'soft_skill'
      );

      const certifications = this.extractCertifications(normalizedText);

      // Combine all skills
      const allSkills = [
        ...technicalSkills.map(s => s.skill),
        ...frameworks.map(s => s.skill),
        ...databases.map(s => s.skill),
        ...cloudPlatforms.map(s => s.skill),
        ...tools.map(s => s.skill),
        ...softSkills.map(s => s.skill),
      ];

      // Calculate confidence based on number of skills found
      const confidence = this.calculateConfidence(allSkills.length);

      const processingTime = Date.now() - startTime;
      logger.info(`Skills extraction completed in ${processingTime}ms. Found ${allSkills.length} skills.`);

      return {
        technicalSkills,
        softSkills,
        tools,
        languages: technicalSkills, // Alias for backward compatibility
        frameworks,
        databases,
        cloudPlatforms,
        certifications,
        allSkills: [...new Set(allSkills)], // Remove duplicates
        confidence,
      };
    } catch (error: any) {
      logger.error('Skills extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Normalize text for better matching
   */
  private normalizeText(text: string): string {
    return text
      .replace(/[^\w\s.,;:()\-\/\+#]/g, ' ') // Keep basic punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract skills from a specific category
   */
  private extractCategory(
    text: string,
    skillsList: string[],
    category: string
  ): SkillMatch[] {
    const matches: SkillMatch[] = [];
    const lowerText = text.toLowerCase();

    for (const skill of skillsList) {
      const lowerSkill = skill.toLowerCase();

      // Create regex pattern for whole word matching
      const pattern = new RegExp(
        `\\b${this.escapeRegex(lowerSkill)}\\b`,
        'gi'
      );

      const match = pattern.exec(lowerText);

      if (match) {
        // Extract context around the skill (for proficiency detection)
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(lowerText.length, match.index + skill.length + 50);
        const context = text.substring(contextStart, contextEnd);

        // Try to detect proficiency level from context
        const proficiency = this.detectProficiency(context);
        const yearsOfExperience = this.detectYearsOfExperience(context);

        matches.push({
          skill,
          category,
          proficiency,
          yearsOfExperience,
          matchedContext: context.trim(),
        });
      }
    }

    return matches;
  }

  /**
   * Extract certifications from text
   */
  private extractCertifications(text: string): string[] {
    const certifications: string[] = [];
    const lines = text.split('\n');

    // Look for certification section
    let inCertificationSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      // Detect certification section headers
      if (
        line.includes('certification') ||
        line.includes('certificate') ||
        line.includes('licenses')
      ) {
        inCertificationSection = true;
        continue;
      }

      // Stop at next major section
      if (
        inCertificationSection &&
        (line.includes('experience') ||
          line.includes('education') ||
          line.includes('skills'))
      ) {
        inCertificationSection = false;
      }

      // Extract certifications from section
      if (inCertificationSection && line.length > 5) {
        certifications.push(lines[i].trim());
      }

      // Also check for certification keywords anywhere in text
      for (const keyword of SkillsExtractorAgent.CERTIFICATIONS_KEYWORDS) {
        if (line.includes(keyword.toLowerCase())) {
          certifications.push(lines[i].trim());
          break;
        }
      }
    }

    return [...new Set(certifications)]; // Remove duplicates
  }

  /**
   * Detect proficiency level from context
   */
  private detectProficiency(context: string): string | undefined {
    const lowerContext = context.toLowerCase();

    if (
      lowerContext.includes('expert') ||
      lowerContext.includes('advanced') ||
      lowerContext.includes('mastery') ||
      lowerContext.includes('senior')
    ) {
      return 'expert';
    }

    if (
      lowerContext.includes('intermediate') ||
      lowerContext.includes('proficient') ||
      lowerContext.includes('experienced')
    ) {
      return 'intermediate';
    }

    if (
      lowerContext.includes('beginner') ||
      lowerContext.includes('basic') ||
      lowerContext.includes('junior') ||
      lowerContext.includes('learning')
    ) {
      return 'beginner';
    }

    return undefined;
  }

  /**
   * Detect years of experience with a skill from context
   */
  private detectYearsOfExperience(context: string): number | undefined {
    // Pattern: "5 years", "5+ years", "5-7 years"
    const yearPattern = /(\d+)[\+\-]?\s*(years?|yrs?)/i;
    const match = context.match(yearPattern);

    if (match) {
      return parseInt(match[1], 10);
    }

    return undefined;
  }

  /**
   * Calculate confidence score based on number of skills found
   */
  private calculateConfidence(skillCount: number): number {
    if (skillCount >= 15) return 95;
    if (skillCount >= 10) return 85;
    if (skillCount >= 7) return 75;
    if (skillCount >= 5) return 65;
    if (skillCount >= 3) return 55;
    return 40;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Match skills against job requirements
   */
  matchSkillsToRequirements(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[] = []
  ): {
    matchedRequired: string[];
    missingRequired: string[];
    matchedPreferred: string[];
    matchScore: number;
  } {
    const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());

    const matchedRequired = requiredSkills.filter(skill =>
      normalizedCandidateSkills.includes(skill.toLowerCase())
    );

    const missingRequired = requiredSkills.filter(
      skill => !normalizedCandidateSkills.includes(skill.toLowerCase())
    );

    const matchedPreferred = preferredSkills.filter(skill =>
      normalizedCandidateSkills.includes(skill.toLowerCase())
    );

    // Calculate match score
    const requiredScore = requiredSkills.length > 0
      ? (matchedRequired.length / requiredSkills.length) * 70
      : 0;

    const preferredScore = preferredSkills.length > 0
      ? (matchedPreferred.length / preferredSkills.length) * 30
      : 30; // Give full points if no preferred skills specified

    const matchScore = Math.round(requiredScore + preferredScore);

    return {
      matchedRequired,
      missingRequired,
      matchedPreferred,
      matchScore,
    };
  }
}

export default SkillsExtractorAgent;
