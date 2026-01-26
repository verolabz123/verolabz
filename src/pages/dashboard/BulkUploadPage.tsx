import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  downloadSampleExcel,
  formatFileSize,
  validateExcelStructure,
} from "@/lib/excel-parser";
import { uploadExcelToHFSpace, createBatchUploadRecord } from "@/lib/hf-space";

interface UploadState {
  status: "idle" | "validating" | "uploading" | "success" | "error";
  progress: number;
  message: string;
}

export default function BulkUploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{
    valid: boolean;
    error?: string;
    rowCount?: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setFileValidation(null);

    setUploadState({
      status: "validating",
      progress: 10,
      message: "Validating Excel structure...",
    });

    // Quick validation of Excel structure (headers only)
    const validation = await validateExcelStructure(file);

    if (!validation.valid) {
      setUploadState({
        status: "error",
        progress: 0,
        message: validation.error || "Invalid Excel file",
      });
      setFileValidation({
        valid: false,
        error: validation.error,
      });
      toast({
        title: "Validation Failed",
        description: validation.error || "Invalid Excel file structure",
        variant: "destructive",
      });
      return;
    }

    setUploadState({
      status: "success",
      progress: 100,
      message: `Excel file validated - ${validation.rowCount || 0} rows found`,
    });

    setFileValidation({
      valid: true,
      rowCount: validation.rowCount,
    });

    toast({
      title: "File Ready",
      description: `Excel validated. Ready to upload ${validation.rowCount || 0} candidates.`,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile || !fileValidation?.valid) {
      return;
    }

    setUploadState({
      status: "uploading",
      progress: 20,
      message: "Uploading Excel to HF Space...",
    });

    try {
      // Create batch upload record
      await createBatchUploadRecord(
        user.uid,
        selectedFile.name,
        fileValidation.rowCount || 0,
      );

      // Upload Excel file directly to HF Space
      const result = await uploadExcelToHFSpace(
        selectedFile,
        user.uid,
        (progress) => {
          setUploadState({
            status: "uploading",
            progress,
            message:
              progress < 100
                ? "Uploading to HF Space..."
                : "Processing in HF Space...",
          });
        },
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      setUploadState({
        status: "success",
        progress: 100,
        message: "Excel uploaded successfully! HF Space is processing...",
      });

      toast({
        title: "Upload Complete",
        description: `Excel uploaded to HF Space. Check the Candidates page for results.`,
      });

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setFileValidation(null);
        setUploadState({
          status: "idle",
          progress: 0,
          message: "",
        });
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Upload failed",
      });
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload to HF Space",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileValidation(null);
    setUploadState({
      status: "idle",
      progress: 0,
      message: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case "validating":
      case "uploading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bulk Upload</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Upload Excel file with candidate information for bulk processing
        </p>
      </div>

      {/* Info Cards - REMOVED per user request */}

      {/* Required Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Required Excel Schema</CardTitle>
          <CardDescription>
            Your Excel file must include these exact columns (case-sensitive)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">
                    Column Name
                  </th>
                  <th className="text-left py-2 px-4 font-semibold">
                    Description
                  </th>
                  <th className="text-left py-2 px-4 font-semibold">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-4">
                    <code className="bg-[hsl(var(--muted))] px-2 py-1 rounded">
                      name
                    </code>
                  </td>
                  <td className="py-2 px-4">Candidate's full name</td>
                  <td className="py-2 px-4">Yash Dave</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">
                    <code className="bg-[hsl(var(--muted))] px-2 py-1 rounded">
                      email
                    </code>
                  </td>
                  <td className="py-2 px-4">Unique email address</td>
                  <td className="py-2 px-4">yash@gmail.com</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">
                    <code className="bg-[hsl(var(--muted))] px-2 py-1 rounded">
                      phone
                    </code>
                  </td>
                  <td className="py-2 px-4">Contact number</td>
                  <td className="py-2 px-4">7802933750</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4">
                    <code className="bg-[hsl(var(--muted))] px-2 py-1 rounded">
                      jobId
                    </code>
                  </td>
                  <td className="py-2 px-4">Job role identifier</td>
                  <td className="py-2 px-4">frontend-dev</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">
                    <code className="bg-[hsl(var(--muted))] px-2 py-1 rounded">
                      resume_url
                    </code>
                  </td>
                  <td className="py-2 px-4">Public resume link (PDF/DOCX)</td>
                  <td className="py-2 px-4">https://.../resume.pdf</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Button onClick={downloadSampleExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Sample Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Drag and drop or click to select an Excel file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
              : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
              id="excel-upload"
            />

            {!selectedFile ? (
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
                <p className="text-lg font-medium mb-2">
                  Drop your Excel file here or click to browse
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </label>
            ) : (
              <div className="space-y-4">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-emerald-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {uploadState.status !== "idle" && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">
                    {uploadState.message}
                  </span>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {uploadState.progress}%
                </span>
              </div>
              <Progress value={uploadState.progress} />
            </div>
          )}

          {/* Validation Results */}
          {fileValidation && (
            <div className="mt-6">
              {fileValidation.valid ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-700 dark:text-emerald-400">
                        File Structure Valid
                      </h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                        Excel file has correct columns. Found ~
                        {fileValidation.rowCount || 0} rows. Ready to upload to
                        HF Space for processing.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-700 dark:text-red-400">
                        Validation Failed
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {fileValidation.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            {selectedFile && (
              <Button onClick={handleReset} variant="outline">
                <XCircle className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}

            {fileValidation?.valid && uploadState.status !== "uploading" && (
              <Button onClick={handleUpload} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel to HF Space
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works - REMOVED per user request */}
    </div>
  );
}
