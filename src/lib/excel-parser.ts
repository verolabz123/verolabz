/**
 * Excel Parser Utility
 * Handles reading and parsing Excel/CSV files for bulk candidate upload
 */

import * as XLSX from "xlsx";

export interface ParsedExcelData {
  headers: string[];
  rows: any[];
  totalRows: number;
}

export interface ExcelParseResult {
  success: boolean;
  data?: ParsedExcelData;
  error?: string;
}

const REQUIRED_COLUMNS = ["name", "email", "phone", "jobId", "resume_url"];

/**
 * Parse Excel file (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  try {
    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["xlsx", "xls", "csv"];

    if (
      !validTypes.includes(file.type) &&
      !validExtensions.includes(fileExtension || "")
    ) {
      return {
        success: false,
        error: "Invalid file type. Please upload .xlsx, .xls, or .csv file",
      };
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse with xlsx library
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        error: "Excel file has no sheets",
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return {
        success: false,
        error: "Failed to read worksheet",
      };
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        error: "Excel file is empty",
      };
    }

    // Extract headers (preserve original case, just trim whitespace)
    const headers = Object.keys(jsonData[0] as Record<string, any>).map((h) =>
      String(h).trim(),
    );

    // Trim whitespace from keys but preserve case
    const normalizedRows = jsonData.map((row: any) => {
      const normalizedRow: any = {};
      Object.keys(row).forEach((key) => {
        const normalizedKey = String(key).trim();
        normalizedRow[normalizedKey] = row[key];
      });
      return normalizedRow;
    });

    // Validate required columns
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col),
    );

    if (missingColumns.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingColumns.join(", ")}`,
      };
    }

    return {
      success: true,
      data: {
        headers,
        rows: normalizedRows,
        totalRows: normalizedRows.length,
      },
    };
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to parse Excel file",
    };
  }
}

/**
 * Validate Excel structure without parsing full content
 */
export async function validateExcelStructure(
  file: File,
): Promise<{ valid: boolean; error?: string; rowCount?: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", sheetRows: 1 });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { valid: false, error: "No sheets found in Excel file" };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return { valid: false, error: "Failed to read worksheet" };
    }

    const headers = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    })[0] as string[];

    const normalizedHeaders = headers.map((h) => String(h).trim());

    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !normalizedHeaders.includes(col),
    );

    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: `Missing required columns: ${missingColumns.join(", ")}`,
      };
    }

    // Get total row count
    const rangeRef = worksheet["!ref"];
    if (!rangeRef) {
      return { valid: true, rowCount: 0 };
    }
    const range = XLSX.utils.decode_range(rangeRef);
    const rowCount = range.e.r; // End row (0-indexed)

    return { valid: true, rowCount };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to validate Excel structure",
    };
  }
}

/**
 * Generate sample Excel file for download
 */
export function generateSampleExcel(): Blob {
  const sampleData = [
    {
      name: "Yash Dave",
      email: "yash@gmail.com",
      phone: "7802933750",
      jobId: "frontend-dev",
      resume_url: "https://example.com/resumes/yash-dave.pdf",
    },
    {
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      phone: "9123456789",
      jobId: "frontend-dev",
      resume_url: "https://example.com/resumes/rahul-sharma.pdf",
    },
    {
      name: "Priya Patel",
      email: "priya@gmail.com",
      phone: "8765432109",
      jobId: "backend-dev",
      resume_url: "https://example.com/resumes/priya-patel.pdf",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

  // Set column widths
  const columnWidths = [
    { wch: 20 }, // name
    { wch: 30 }, // email
    { wch: 15 }, // phone
    { wch: 20 }, // jobId
    { wch: 50 }, // resume_url
  ];
  worksheet["!cols"] = columnWidths;

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Download sample Excel file
 */
export function downloadSampleExcel() {
  const blob = generateSampleExcel();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "candidate_upload_template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert Excel data to CSV string
 */
export function excelToCSV(data: ParsedExcelData): string {
  const headers = REQUIRED_COLUMNS.join(",");
  const rows = data.rows
    .map((row) => {
      return REQUIRED_COLUMNS.map((col) => {
        const value = row[col] || "";
        // Escape commas and quotes
        if (value.includes(",") || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",");
    })
    .join("\n");

  return `${headers}\n${rows}`;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
