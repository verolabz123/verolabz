"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import {
  UserCheck,
  UserX,
  Clock,
  FileText,
  Briefcase,
  Award,
  Brain,
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

interface CandidateModalProps {
  resume: Resume | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  shortlisted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-600 border-red-500/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export function CandidateModal({
  resume,
  isOpen,
  onClose,
  onStatusChange,
  isLoading,
}: CandidateModalProps) {
  if (!resume) return null;

  const skills =
    resume.skills
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">
                {resume.candidateName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4" />
                {resume.fileName}
              </DialogDescription>
            </div>
            <Badge className={statusColors[resume.status]}>
              {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ATS Score */}
          <div className="p-4 rounded-lg bg-[hsl(var(--muted))]/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[hsl(var(--primary))]" />
                <span className="font-medium">ATS Score</span>
              </div>
              <span className="text-2xl font-bold text-[hsl(var(--primary))]">
                {resume.atsScore}%
              </span>
            </div>
            <Progress value={resume.atsScore} className="h-2" />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-medium">Experience</span>
            </div>
            <p className="text-[hsl(var(--muted-foreground))]">
              {resume.experienceYears}{" "}
              {resume.experienceYears === 1 ? "year" : "years"} of experience
            </p>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-medium">Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* AI Reasoning */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-medium">AI Reasoning (Demo)</span>
            </div>
            <div className="p-4 rounded-lg bg-[hsl(var(--muted))]/50 text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
              {resume.aiReasoning ||
                "AI analysis will appear here once the resume has been fully processed."}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            Uploaded on {formatDate(resume.createdAt)}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              className="flex-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => onStatusChange(resume.id, "shortlisted")}
              disabled={isLoading || resume.status === "shortlisted"}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Shortlist
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
              onClick={() => onStatusChange(resume.id, "pending")}
              disabled={isLoading || resume.status === "pending"}
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
              onClick={() => onStatusChange(resume.id, "rejected")}
              disabled={isLoading || resume.status === "rejected"}
            >
              <UserX className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
