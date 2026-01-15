import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  RefreshCw,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import { type FirebaseApplicant } from "@/lib/firebase-db";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

interface ApplicantStats {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  shortlisted: number;
  rejected: number;
  failed: number;
}

const statusColors: Record<string, string> = {
  queued: "bg-blue-500/15 text-blue-600",
  processing: "bg-amber-500/15 text-amber-600",
  completed: "bg-gray-500/15 text-gray-600",
  shortlisted: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
  failed: "bg-red-500/15 text-red-600",
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  failed: "Failed",
};

export default function CandidatesPage() {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<FirebaseApplicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<
    FirebaseApplicant[]
  >([]);
  const [stats, setStats] = useState<ApplicantStats>({
    total: 0,
    queued: 0,
    processing: 0,
    completed: 0,
    shortlisted: 0,
    rejected: 0,
    failed: 0,
  });
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Selection state for CSV export
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Real-time listener for applicants
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time listener for applicants
    const q = query(
      collection(db, "applicants"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const applicantsData: FirebaseApplicant[] = [];
        snapshot.forEach((doc) => {
          applicantsData.push({
            id: doc.id,
            ...doc.data(),
          } as FirebaseApplicant);
        });

        setApplicants(applicantsData);
        setFilteredApplicants(applicantsData);

        // Extract job IDs
        const jobIdsData = [
          ...new Set(applicantsData.map((a) => a.candidate.jobId)),
        ];
        setJobIds(jobIdsData);

        // Calculate stats
        const statsData = {
          total: applicantsData.length,
          queued: applicantsData.filter((a) => a.status === "queued").length,
          processing: applicantsData.filter((a) => a.status === "processing")
            .length,
          completed: applicantsData.filter((a) => a.status === "completed")
            .length,
          shortlisted: applicantsData.filter((a) => a.status === "shortlisted")
            .length,
          rejected: applicantsData.filter((a) => a.status === "rejected")
            .length,
          failed: applicantsData.filter((a) => a.status === "failed").length,
        };
        setStats(statsData);

        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to applicants:", error);
        toast({
          title: "Error",
          description: "Failed to load candidates",
          variant: "destructive",
        });
        setIsLoading(false);
      },
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    let filtered = [...applicants];

    // Filter by job ID
    if (selectedJobId !== "all") {
      filtered = filtered.filter((a) => a.candidate.jobId === selectedJobId);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((a) => a.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.candidate.name.toLowerCase().includes(query) ||
          a.candidate.email.toLowerCase().includes(query) ||
          a.candidate.phone.includes(query) ||
          a.candidate.jobId.toLowerCase().includes(query),
      );
    }

    setFilteredApplicants(filtered);

    // Reset selection for any IDs no longer visible
    setSelectedIds((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of Object.keys(prev)) {
        if (filtered.find((f) => f.id === id) && prev[id]) {
          next[id] = true;
        }
      }
      return next;
    });
  }, [applicants, selectedJobId, selectedStatus, searchQuery]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return "text-gray-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  // Selection helpers
  const toggleSelect = (id?: string) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const selectAllVisible = () => {
    const allSelected = filteredApplicants.every(
      (a) => selectedIds[a.id || ""] === true,
    );
    if (allSelected) {
      // clear
      setSelectedIds((prev) => {
        const next: Record<string, boolean> = {};
        // maintain any selections for items not currently visible
        for (const id of Object.keys(prev)) {
          if (!filteredApplicants.find((f) => f.id === id)) next[id] = true;
        }
        return next;
      });
    } else {
      // select all visible
      setSelectedIds((prev) => {
        const next = { ...prev };
        filteredApplicants.forEach((a) => {
          if (a.id) next[a.id] = true;
        });
        return next;
      });
    }
  };

  const getSelectedApplicants = () => {
    const ids = new Set(
      Object.keys(selectedIds).filter((id) => selectedIds[id]),
    );
    return filteredApplicants.filter((a) => a.id && ids.has(a.id));
  };

  // CSV export
  const escapeCsv = (value: any) => {
    if (value === undefined || value === null) return "";
    const s = String(value);
    // If contains quote, comma, newline, wrap in quotes and escape quotes
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const exportSelectedToCSV = () => {
    const selected = getSelectedApplicants();
    if (selected.length === 0) {
      toast({
        title: "No selection",
        description: "Please select one or more candidates to export.",
        variant: "destructive",
      });
      return;
    }

    // Headers: include core fields and more
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Job ID",
      "Resume URL",
      "Score",
      "Status",
      "Skills",
      "Reason",
      "Uploaded At",
    ];

    const rows = selected.map((a) => {
      const skills = a.parsed?.skills ? a.parsed.skills.join(", ") : "";
      const uploadedAt = a.createdAt ? formatDate(a.createdAt) : "";
      return [
        escapeCsv(a.candidate.name),
        escapeCsv(a.candidate.email),
        escapeCsv(a.candidate.phone),
        escapeCsv(a.candidate.jobId),
        escapeCsv(a.resumeUrl),
        escapeCsv(a.score),
        escapeCsv(a.status),
        escapeCsv(skills),
        escapeCsv(a.reason),
        escapeCsv(uploadedAt),
      ].join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");

    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date();
      const stamp = date.toISOString().replace(/[:.]/g, "-");
      link.setAttribute("href", url);
      link.setAttribute("download", `candidates_export_${stamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Exported",
        description: `Exported ${selected.length} candidate(s)`,
      });

      // Optionally clear selection after export
      // clearSelection();
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast({
        title: "Error",
        description: "Failed to generate CSV",
        variant: "destructive",
      });
    }
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const allVisibleSelected =
    filteredApplicants.length > 0 &&
    filteredApplicants.every((a) => a.id && selectedIds[a.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            View and manage all processed candidates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.queued}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.processing}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.shortlisted}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            {/* Job ID Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Job Role</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Jobs</option>
                {jobIds.map((jobId) => (
                  <option key={jobId} value={jobId}>
                    {jobId}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Statuses</option>
                <option value="queued">Queued</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Candidate List</CardTitle>
              <CardDescription>
                Showing {filteredApplicants.length} of {applicants.length}{" "}
                candidates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => selectAllVisible()}
                  className="h-4 w-4"
                />
                <span>Select all visible</span>
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={exportSelectedToCSV}
                disabled={selectedCount === 0}
                title={
                  selectedCount === 0
                    ? "Select candidates to export"
                    : `Export ${selectedCount} candidate(s)`
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[hsl(var(--muted-foreground))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-4">
                Loading candidates...
              </p>
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
              <h3 className="font-semibold mb-2">No candidates found</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {applicants.length === 0
                  ? "Upload your first Excel file to get started"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="p-4 border rounded-lg hover:bg-[hsl(var(--muted))]/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              !!(applicant.id && selectedIds[applicant.id])
                            }
                            onChange={() => toggleSelect(applicant.id)}
                            className="h-4 w-4"
                            aria-label={`select-${applicant.id}`}
                          />
                        </div>
                        <h4 className="font-semibold">
                          {applicant.candidate.name}
                        </h4>
                        <Badge className={statusColors[applicant.status]}>
                          {statusLabels[applicant.status]}
                        </Badge>
                        <Badge variant="outline">
                          {applicant.candidate.jobId}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
                        <p>📧 {applicant.candidate.email}</p>
                        <p>📱 {applicant.candidate.phone}</p>
                        {applicant.parsed?.skills &&
                          applicant.parsed.skills.length > 0 && (
                            <p>
                              💼 Skills:{" "}
                              {applicant.parsed.skills.slice(0, 5).join(", ")}
                              {applicant.parsed.skills.length > 5 && "..."}
                            </p>
                          )}
                        {applicant.reason && (
                          <p className="text-xs italic mt-2">
                            💡 {applicant.reason}
                          </p>
                        )}
                        <p className="text-xs">
                          Uploaded: {formatDate(applicant.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Score & Actions */}
                    <div className="text-right space-y-2">
                      {applicant.score !== undefined && (
                        <div>
                          <div className="text-2xl font-bold">
                            <span className={getScoreColor(applicant.score)}>
                              {applicant.score}
                            </span>
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">
                              /100
                            </span>
                          </div>
                          <Progress
                            value={applicant.score}
                            className="h-2 w-24 mt-1"
                          />
                        </div>
                      )}
                      {applicant.resumeUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(applicant.resumeUrl, "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Resume
                        </Button>
                      )}
                    </div>
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
