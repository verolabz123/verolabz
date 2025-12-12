"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CandidateModal } from "@/components/dashboard/CandidateModal";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import {
    Upload,
    FileText,
    FileUp,
    RefreshCw,
    Search,
    Filter,
    MoreHorizontal,
} from "lucide-react";

interface Resume {
    id: string;
    candidateName: string;
    fileName: string;
    fileUrl: string;
    skills: string;
    experienceYears: number;
    atsScore: number;
    status: string;
    aiReasoning?: string;
    createdAt: string;
}

const statusColors: Record<string, string> = {
    shortlisted: "bg-emerald-500/15 text-emerald-600",
    rejected: "bg-red-500/15 text-red-600",
    pending: "bg-amber-500/15 text-amber-600",
};

const statusLabels: Record<string, string> = {
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    pending: "Pending",
};

export default function UploadsPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const fetchResumes = useCallback(async () => {
        try {
            const res = await fetch("/api/resumes");
            if (res.ok) {
                const data = await res.json();
                setResumes(data.resumes);
            }
        } catch (error) {
            console.error("Failed to fetch resumes:", error);
            toast({ title: "Error", description: "Failed to load resumes", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResumes();
    }, [fetchResumes]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/resumes", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    successCount++;
                } else {
                    const error = await res.json();
                    console.error("Upload error:", error);
                    errorCount++;
                }
            } catch (error) {
                console.error("Upload failed:", error);
                errorCount++;
            }
        }

        setIsUploading(false);

        if (successCount > 0) {
            toast({
                title: "Upload Complete",
                description: `${successCount} resume${successCount > 1 ? "s" : ""} uploaded successfully`,
                variant: "success",
            });
            fetchResumes();
        }

        if (errorCount > 0) {
            toast({
                title: "Upload Error",
                description: `${errorCount} file${errorCount > 1 ? "s" : ""} failed to upload`,
                variant: "destructive",
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/resumes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                toast({
                    title: "Status Updated",
                    description: `Candidate marked as ${status}`,
                    variant: "success",
                });
                fetchResumes();

                // Update selected resume if modal is open
                const updated = await res.json();
                if (selectedResume?.id === id) {
                    setSelectedResume(updated.resume);
                }
            } else {
                throw new Error("Failed to update status");
            }
        } catch (error) {
            console.error("Status update failed:", error);
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            });
        }
    };

    const openCandidateModal = (resume: Resume) => {
        setSelectedResume(resume);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Resume Uploads</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">
                        Upload and manage candidate resumes
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchResumes}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Upload Area */}
            <Card
                className={`border-2 border-dashed transition-colors ${isDragOver
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                        : "border-[hsl(var(--border))]"
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        {isUploading ? (
                            <>
                                <RefreshCw className="h-12 w-12 text-[hsl(var(--primary))] animate-spin mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Uploading...</h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    Processing your resumes
                                </p>
                            </>
                        ) : (
                            <>
                                <FileUp className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    Drag and drop resumes here
                                </h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                                    Supports PDF, DOCX, and TXT files
                                </p>
                                <label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.txt"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e.target.files)}
                                    />
                                    <Button asChild>
                                        <span>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Browse Files
                                        </span>
                                    </Button>
                                </label>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Resume Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Uploaded Resumes</CardTitle>
                            <CardDescription>{resumes.length} total candidates</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
                        </div>
                    ) : resumes.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
                            <h3 className="font-semibold mb-2">No resumes yet</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Upload your first resume to get started
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[hsl(var(--border))]">
                                        <th className="text-left py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            Candidate
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            Skills
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            Experience
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            ATS Score
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            Uploaded
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-[hsl(var(--muted-foreground))]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resumes.map((resume) => (
                                        <tr
                                            key={resume.id}
                                            className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 cursor-pointer transition-colors"
                                            onClick={() => openCandidateModal(resume)}
                                        >
                                            <td className="py-4 px-4">
                                                <div>
                                                    <div className="font-medium">{resume.candidateName}</div>
                                                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                                                        {resume.fileName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {resume.skills
                                                        .split(",")
                                                        .slice(0, 3)
                                                        .map((skill, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {skill.trim()}
                                                            </Badge>
                                                        ))}
                                                    {resume.skills.split(",").length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{resume.skills.split(",").length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span>{resume.experienceYears} years</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={resume.atsScore} className="w-16 h-2" />
                                                    <span className="font-medium">{resume.atsScore}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge className={statusColors[resume.status]}>
                                                    {statusLabels[resume.status]}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                {formatDate(resume.createdAt)}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openCandidateModal(resume);
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Candidate Modal */}
            <CandidateModal
                resume={selectedResume}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}
