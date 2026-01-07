/**
 * Hugging Face Space Integration
 * Handles bulk candidate processing via Excel upload
 * Now supports both HF Space and Backend API
 */

// Configuration - Use backend by default if available
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND !== "false"; // Default to true
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// HF Space URL - FastAPI endpoint (fallback)
const HF_SPACE_URL = "https://omgy-resume.hf.space";
const HF_API_ENDPOINT = `${HF_SPACE_URL}/upload-excel`;

/**
 * Infer required skills based on job title
 */
function inferRequiredSkills(jobTitle: string): string[] {
  const title = jobTitle.toLowerCase();

  // Full Stack Developer
  if (title.includes("full stack") || title.includes("fullstack")) {
    return [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "HTML",
      "CSS",
      "SQL",
      "REST API",
      "Git",
    ];
  }

  // Frontend Developer
  if (
    title.includes("frontend") ||
    title.includes("front-end") ||
    title.includes("front end")
  ) {
    return [
      "JavaScript",
      "TypeScript",
      "React",
      "HTML",
      "CSS",
      "Responsive Design",
      "Git",
    ];
  }

  // Backend Developer
  if (
    title.includes("backend") ||
    title.includes("back-end") ||
    title.includes("back end")
  ) {
    return [
      "Node.js",
      "Python",
      "Java",
      "SQL",
      "REST API",
      "Database Design",
      "Git",
    ];
  }

  // Data Scientist / Data Analyst
  if (title.includes("data scientist") || title.includes("data analyst")) {
    return [
      "Python",
      "SQL",
      "Machine Learning",
      "Pandas",
      "NumPy",
      "Data Analysis",
      "Statistics",
    ];
  }

  // DevOps Engineer
  if (title.includes("devops") || title.includes("sre")) {
    return [
      "Docker",
      "Kubernetes",
      "AWS",
      "CI/CD",
      "Linux",
      "Terraform",
      "Git",
    ];
  }

  // Mobile Developer
  if (
    title.includes("mobile") ||
    title.includes("ios") ||
    title.includes("android")
  ) {
    return [
      "React Native",
      "Flutter",
      "iOS",
      "Android",
      "Mobile Development",
      "Git",
    ];
  }

  // QA / Test Engineer
  if (
    title.includes("qa") ||
    title.includes("test") ||
    title.includes("quality assurance")
  ) {
    return [
      "Test Automation",
      "Selenium",
      "Jest",
      "Manual Testing",
      "Bug Tracking",
      "Git",
    ];
  }

  // UI/UX Designer
  if (
    title.includes("ui") ||
    title.includes("ux") ||
    title.includes("designer")
  ) {
    return [
      "Figma",
      "Adobe XD",
      "UI Design",
      "UX Design",
      "Prototyping",
      "User Research",
    ];
  }

  // Project Manager / Product Manager
  if (title.includes("project manager") || title.includes("product manager")) {
    return [
      "Agile",
      "Scrum",
      "Jira",
      "Project Management",
      "Stakeholder Management",
      "Communication",
    ];
  }

  // Default for generic developer roles
  return [
    "Programming",
    "Software Development",
    "Problem Solving",
    "Git",
    "Communication",
  ];
}

/**
 * Infer required experience based on job title
 */
function inferRequiredExperience(jobTitle: string): number {
  const title = jobTitle.toLowerCase();

  if (
    title.includes("senior") ||
    title.includes("sr.") ||
    title.includes("sr ")
  ) {
    return 5;
  }

  if (
    title.includes("lead") ||
    title.includes("principal") ||
    title.includes("staff")
  ) {
    return 7;
  }

  if (
    title.includes("architect") ||
    title.includes("director") ||
    title.includes("vp")
  ) {
    return 10;
  }

  if (
    title.includes("junior") ||
    title.includes("jr.") ||
    title.includes("jr ") ||
    title.includes("entry")
  ) {
    return 0;
  }

  if (title.includes("mid") || title.includes("intermediate")) {
    return 3;
  }

  // Default for unspecified level
  return 2;
}

/**
 * Infer seniority level based on job title
 */
function inferSeniorityLevel(
  jobTitle: string,
): "entry" | "mid" | "senior" | "lead" | "executive" {
  const title = jobTitle.toLowerCase();

  if (
    title.includes("cto") ||
    title.includes("ceo") ||
    title.includes("vp") ||
    title.includes("director")
  ) {
    return "executive";
  }

  if (
    title.includes("lead") ||
    title.includes("principal") ||
    title.includes("staff") ||
    title.includes("architect")
  ) {
    return "lead";
  }

  if (
    title.includes("senior") ||
    title.includes("sr.") ||
    title.includes("sr ")
  ) {
    return "senior";
  }

  if (
    title.includes("junior") ||
    title.includes("jr.") ||
    title.includes("jr ") ||
    title.includes("entry")
  ) {
    return "entry";
  }

  // Default to mid-level
  return "mid";
}

/**
 * Generate job description based on title and skills
 */
function generateJobDescription(
  jobTitle: string,
  requiredSkills: string[],
): string {
  return `We are seeking a talented ${jobTitle} to join our team.

The ideal candidate will have strong expertise in: ${requiredSkills.slice(0, 5).join(", ")}.

This role involves working on challenging projects, collaborating with cross-functional teams, and contributing to the development of innovative solutions.

Key Requirements:
${requiredSkills.map((skill) => `- ${skill}`).join("\n")}

We value candidates who demonstrate strong problem-solving abilities, excellent communication skills, and a passion for technology.`;
}

export interface ExcelRow {
  name: string;
  email: string;
  phone: string;
  jobId: string;
  resume_url: string;
  resume_text?: string;
}

export interface HFSpaceResponse {
  success: boolean;
  message: string;
  processed?: number;
  failed?: number;
  errors?: string[];
}

/**
 * Validate Excel row against strict schema
 */
export function validateExcelRow(
  row: any,
  rowIndex: number,
): {
  valid: boolean;
  errors: string[];
  data?: ExcelRow;
} {
  const errors: string[] = [];

  // Check required fields
  if (!row.name || typeof row.name !== "string" || !row.name.trim()) {
    errors.push(`Row ${rowIndex}: Missing or invalid 'name'`);
  }

  if (!row.email || typeof row.email !== "string" || !row.email.trim()) {
    errors.push(`Row ${rowIndex}: Missing or invalid 'email'`);
  } else if (!isValidEmail(row.email)) {
    errors.push(`Row ${rowIndex}: Invalid email format`);
  }

  if (!row.phone || typeof row.phone !== "string" || !row.phone.trim()) {
    errors.push(`Row ${rowIndex}: Missing or invalid 'phone'`);
  }

  if (!row.jobId || typeof row.jobId !== "string" || !row.jobId.trim()) {
    errors.push(`Row ${rowIndex}: Missing or invalid 'jobId'`);
  }

  if (
    !row.resume_url ||
    typeof row.resume_url !== "string" ||
    !row.resume_url.trim()
  ) {
    errors.push(`Row ${rowIndex}: Missing or invalid 'resume_url'`);
  } else if (!isValidUrl(row.resume_url)) {
    errors.push(`Row ${rowIndex}: Invalid resume URL format`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      name: row.name.trim(),
      email: row.email.trim().toLowerCase(),
      phone: row.phone.trim(),
      jobId: row.jobId.trim(),
      resume_url: row.resume_url.trim(),
    },
  };
}

/**
 * Validate entire Excel data
 */
export function validateExcelData(rows: any[]): {
  valid: boolean;
  errors: string[];
  validRows: ExcelRow[];
  invalidCount: number;
} {
  if (!rows || rows.length === 0) {
    return {
      valid: false,
      errors: ["Excel file is empty"],
      validRows: [],
      invalidCount: 0,
    };
  }

  const allErrors: string[] = [];
  const validRows: ExcelRow[] = [];
  let invalidCount = 0;

  rows.forEach((row, index) => {
    const validation = validateExcelRow(row, index + 2); // +2 for Excel row number (header is row 1)
    if (validation.valid && validation.data) {
      validRows.push(validation.data);
    } else {
      invalidCount++;
      allErrors.push(...validation.errors);
    }
  });

  return {
    valid: validRows.length > 0,
    errors: allErrors,
    validRows,
    invalidCount,
  };
}

/**
 * Upload Excel file directly to HF Space for processing
 * HF Space will:
 * 1. Parse the Excel file
 * 2. Download resumes from resume_url
 * 3. Extract text and parse resumes
 * 4. Send each candidate to n8n webhook
 * 5. n8n will evaluate and write to Firestore
 */
export async function uploadExcelToHFSpace(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void,
): Promise<HFSpaceResponse> {
  // Check if backend should be used
  if (USE_BACKEND) {
    console.log("Using Backend API for Excel processing");
    return uploadExcelToBackend(file, userId, onProgress);
  }

  // Fallback to HF Space
  try {
    onProgress?.(10);

    // Create FormData for FastAPI multipart/form-data upload
    const formData = new FormData();
    formData.append("file", file);

    onProgress?.(30);

    console.log("Uploading Excel to HF Space FastAPI:", HF_API_ENDPOINT);
    console.log("File:", file.name, "Size:", file.size);

    // Send to HF Space FastAPI endpoint
    const response = await fetch(HF_API_ENDPOINT, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    onProgress?.(60);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF Space error response:", errorText);
      throw new Error(`HF Space error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("HF Space response:", result);

    onProgress?.(100);

    // FastAPI returns: { total, processed, results: [...] }
    const successCount =
      result.results?.filter((r: any) => r.status === "sent").length || 0;
    const failedCount =
      result.results?.filter((r: any) => r.status === "failed").length || 0;

    return {
      success: true,
      message: `Processed ${successCount} candidates successfully`,
      processed: successCount,
      failed: failedCount,
      errors:
        result.results
          ?.filter((r: any) => r.status === "failed")
          .map((r: any) => `${r.email}: ${r.error}`) || [],
    };
  } catch (error) {
    console.error("Error uploading to HF Space:", error);
    onProgress?.(0);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to upload to HF Space",
      processed: 0,
      failed: 0,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Upload Excel file to Backend API for processing
 * Backend will parse Excel and evaluate candidates with AI agents
 */
async function uploadExcelToBackend(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void,
): Promise<HFSpaceResponse> {
  try {
    onProgress?.(5);

    // First, read and parse the Excel file
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    onProgress?.(10);

    // Validate data structure
    const validation = validateExcelData(data);
    if (!validation.valid || validation.validRows.length === 0) {
      throw new Error(
        `Invalid Excel data: ${validation.errors.slice(0, 3).join(", ")}`,
      );
    }

    console.log(
      `Sending ${validation.validRows.length} candidates to backend for evaluation`,
    );

    onProgress?.(20);

    // Extract job title from first candidate (or use default)
    const jobTitle = validation.validRows[0]?.jobId || "Position";

    // Determine required skills based on job title
    const requiredSkills = inferRequiredSkills(jobTitle);
    const jobDescription = generateJobDescription(jobTitle, requiredSkills);

    console.log(
      `Inferred ${requiredSkills.length} required skills for ${jobTitle}`,
    );

    // Import backend API
    const { processExcelWithBackend } = await import("./backend-api");

    // Process with backend - with inferred job configuration
    const result = await processExcelWithBackend(
      validation.validRows,
      userId,
      {
        jobTitle,
        jobDescription,
        requiredSkills,
        preferredSkills: [],
        requiredExperience: inferRequiredExperience(jobTitle),
        seniorityLevel: inferSeniorityLevel(jobTitle),
      },
      (backendProgress) => {
        // Map backend progress (20% to 100%)
        const overallProgress = 20 + backendProgress * 0.8;
        onProgress?.(overallProgress);
      },
    );

    return {
      success: result.success,
      message: result.success
        ? `Processed ${result.processed} candidates with AI evaluation`
        : "Failed to process candidates",
      processed: result.processed,
      failed: result.failed,
      errors: result.errors,
    };
  } catch (error) {
    console.error("Error uploading to backend:", error);
    onProgress?.(0);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to upload to backend",
      processed: 0,
      failed: 0,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Send candidate batch directly to HF Space (alternative to file upload)
 */
export async function sendCandidateBatch(
  candidates: ExcelRow[],
  userId: string,
  onProgress?: (progress: number) => void,
): Promise<HFSpaceResponse> {
  try {
    onProgress?.(10);

    const response = await fetch(`${HF_API_ENDPOINT}/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        userId,
        candidates,
      }),
    });

    onProgress?.(80);

    if (!response.ok) {
      throw new Error(`HF Space returned status ${response.status}`);
    }

    const result = await response.json();

    onProgress?.(100);

    return {
      success: true,
      message: "Candidates submitted successfully",
      processed: result.processed || candidates.length,
      failed: result.failed || 0,
      errors: result.errors || [],
    };
  } catch (error) {
    console.error("Error sending batch to HF Space:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send candidates to HF Space",
      processed: 0,
      failed: candidates.length,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  }
}

/**
 * Create a batch upload record in Firebase to track processing
 * HF Space will update candidates as it processes them
 */
export async function createBatchUploadRecord(
  userId: string,
  fileName: string,
  totalCandidates: number,
): Promise<string> {
  const { createBatchUpload } = await import("./firebase-db");

  const batchId = await createBatchUpload({
    userId,
    fileName,
    totalCandidates,
    processed: 0,
    failed: 0,
    status: "processing",
  });

  return batchId;
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper: Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
}

/**
 * Get HF Space or Backend status
 */
export async function getHFSpaceStatus(): Promise<{
  online: boolean;
  message: string;
}> {
  // Check backend if enabled
  if (USE_BACKEND) {
    try {
      const { checkBackendHealth } = await import("./backend-api");
      const health = await checkBackendHealth();
      return {
        online: health.healthy,
        message: health.message,
      };
    } catch (error) {
      return {
        online: false,
        message: "Failed to connect to backend",
      };
    }
  }

  // Fallback to HF Space
  try {
    // Try to reach the FastAPI health endpoint
    const response = await fetch(`${HF_SPACE_URL}/docs`, {
      method: "GET",
    });

    if (response.ok) {
      return { online: true, message: "HF Space FastAPI is online" };
    }

    return { online: false, message: "HF Space is offline or unreachable" };
  } catch (error) {
    return {
      online: false,
      message: "Failed to connect to HF Space",
    };
  }
}

/**
 * Get current processing mode (backend or HF Space)
 */
export function getProcessingMode(): {
  mode: "backend" | "hf-space";
  url: string;
} {
  return {
    mode: USE_BACKEND ? "backend" : "hf-space",
    url: USE_BACKEND ? BACKEND_URL : HF_SPACE_URL,
  };
}
