import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getResumesByUserId,
  createResume,
  deleteResume,
  type FirebaseResume,
} from "@/lib/firebase-db";
import { uploadResumeFile } from "@/lib/firebase-storage";
import { parseResume } from "@/lib/resume-parser";

interface UploadedFile {
  id: string;
  name: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  candidateName?: string;
  atsScore?: number;
  skills?: string[];
  uploadedAt: string;
  error?: string;
}

export default function UploadsPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [existingResumes, setExistingResumes] = useState<FirebaseResume[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExistingResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchExistingResumes = async () => {
    if (!user) {
      setIsLoadingResumes(false);
      return;
    }

    try {
      const resumes = await getResumesByUserId(user.uid);
      setExistingResumes(resumes);
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
      toast({
        title: "Error",
        description: "Failed to load existing resumes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !user) {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload files",
          variant: "destructive",
        });
      }
      return;
    }

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(
      (file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        status: "processing" as const,
        progress: 0,
        uploadedAt: new Date().toISOString(),
      }),
    );

    setFiles((prev) => [...newFiles, ...prev]);

    toast({
      title: "Upload Started",
      description: `Processing ${newFiles.length} file(s)...`,
    });

    // Process each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = newFiles[i].id;
      await processFile(file, fileId);
    }
  };

  const processFile = async (file: File, fileId: string) => {
    if (!user) return;

    try {
      // Update progress: Starting upload
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 10 } : f)),
      );

      // Upload file to Firebase Storage
      const { url: fileUrl } = await uploadResumeFile(file, user.uid);

      // Update progress: File uploaded
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 40 } : f)),
      );

      // Parse resume
      const parsedData = await parseResume(file.name);

      // Update progress: Parsing complete
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 70 } : f)),
      );

      // Save to Firestore
      await createResume({
        userId: user.uid,
        candidateName: parsedData.candidateName,
        fileName: file.name,
        fileUrl: fileUrl,
        skills: parsedData.skills.join(", "),
        experienceYears: parsedData.experienceYears,
        atsScore: parsedData.atsScore,
        aiReasoning: parsedData.aiReasoning,
        status:
          parsedData.atsScore >= 70
            ? "shortlisted"
            : parsedData.atsScore >= 50
              ? "pending"
              : "rejected",
      });

      // Update progress: Complete
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress: 100,
                status: "completed" as const,
                candidateName: parsedData.candidateName,
                atsScore: parsedData.atsScore,
                skills: parsedData.skills.slice(0, 3),
              }
            : f,
        ),
      );

      toast({
        title: "Upload Complete",
        description: `${file.name} processed successfully`,
      });

      // Refresh existing resumes
      await fetchExistingResumes();
    } catch (error) {
      console.error("File processing error:", error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "failed" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      );

      toast({
        title: "Upload Failed",
        description: `Failed to process ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      await deleteResume(resumeId);
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
      await fetchExistingResumes();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-amber-500/15 text-amber-600";
      case "completed":
        return "bg-emerald-500/15 text-emerald-600";
      case "failed":
        return "bg-red-500/15 text-red-600";
      case "shortlisted":
        return "bg-emerald-500/15 text-emerald-600";
      case "pending":
        return "bg-amber-500/15 text-amber-600";
      case "rejected":
        return "bg-red-500/15 text-red-600";
      default:
        return "";
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Resumes</h1>
        <p className="text-muted-foreground">
          Upload and process candidate resumes
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files. Supports bulk uploads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Drag and drop files here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click the button below to select files
            </p>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Files
                </span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOCX, TXT
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Queue</CardTitle>
                <CardDescription>
                  {files.filter((f) => f.status === "processing").length}{" "}
                  processing,{" "}
                  {files.filter((f) => f.status === "completed").length}{" "}
                  completed
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFiles([])}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border"
                >
                  <div className="shrink-0 mt-1">
                    {getStatusIcon(file.status)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {file.name}
                          </span>
                        </div>
                        {file.candidateName && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {file.candidateName}
                          </p>
                        )}
                        {file.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {file.error}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(file.status)}>
                        {file.status}
                      </Badge>
                    </div>

                    {file.status === "processing" && (
                      <div className="space-y-1">
                        <Progress value={file.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Processing... {file.progress}%
                        </p>
                      </div>
                    )}

                    {file.status === "completed" && file.atsScore && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            ATS Score:
                          </span>
                          <span className="font-bold text-primary">
                            {file.atsScore}%
                          </span>
                        </div>
                        {file.skills && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              Skills:
                            </span>
                            <span className="truncate">
                              {file.skills.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Resumes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Resumes</CardTitle>
              <CardDescription>
                {existingResumes.length} total resumes uploaded
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExistingResumes}
              disabled={isLoadingResumes}
            >
              {isLoadingResumes ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingResumes ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : existingResumes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No resumes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first resume to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {existingResumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {resume.candidateName}
                          </span>
                          <Badge className={getStatusColor(resume.status)}>
                            {resume.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {resume.fileName}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResume(resume.id!)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          ATS Score:
                        </span>
                        <span className="font-bold text-primary">
                          {resume.atsScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Experience:
                        </span>
                        <span>{resume.experienceYears} years</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span>
                          {formatDate(
                            resume.createdAt?.toDate?.() || new Date(),
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground">
                        Skills:
                      </span>
                      <span className="text-sm">{resume.skills}</span>
                    </div>

                    {resume.aiReasoning && (
                      <div className="mt-2 p-3 rounded bg-muted text-sm">
                        <span className="font-medium">AI Analysis: </span>
                        {resume.aiReasoning}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
