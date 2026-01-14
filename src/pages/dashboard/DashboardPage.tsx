import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  FileText,
  UserCheck,
  UserX,
  Clock,
  ArrowUpRight,
  Upload,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getResumesByUserId,
  getResumeStats,
  type FirebaseResume,
} from "@/lib/firebase-db";
import { toast } from "@/components/ui/use-toast";

interface DashboardStats {
  stats: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  chartData: { name: string; value: number }[];
  recentCandidates: {
    id: string;
    candidateName: string;
    skills: string;
    atsScore: number;
    status: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  shortlisted: "bg-emerald-500/15 text-emerald-600",
  accepted: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
  pending: "bg-amber-500/15 text-amber-600",
};

// Helper function to generate chart data from resumes
const generateChartData = (resumes: FirebaseResume[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: 0,
      date: date.toDateString(),
    };
  });

  resumes.forEach((resume) => {
    const resumeDate = resume.createdAt?.toDate
      ? resume.createdAt.toDate()
      : new Date();
    const dateStr = resumeDate.toDateString();
    const dayData = last7Days.find((d) => d.date === dateStr);
    if (dayData) {
      dayData.value++;
    }
  });

  return last7Days.map(({ name, value }) => ({ name, value }));
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
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
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch data from both resumes and applicants collections
      const { getApplicantsByUserId, getApplicantStats } = await import('@/lib/firebase-db');

      const [resumeStats, resumes, applicants] = await Promise.all([
        getResumeStats(user.uid),
        getResumesByUserId(user.uid),
        getApplicantsByUserId(user.uid),
      ]);

      // DEBUG: Log what we fetched
      console.log('=== DASHBOARD DEBUG ===');
      console.log('Resume stats:', resumeStats);
      console.log('Total resumes:', resumes.length);
      console.log('Total applicants:', applicants.length);

      // Log applicant statuses
      const applicantStatusCounts = applicants.reduce((acc: any, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      console.log('Applicant status breakdown:', applicantStatusCounts);

      // Log RESUME statuses - this is the key!
      const resumeStatusCounts = resumes.reduce((acc: any, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});
      console.log('RESUME status breakdown:', resumeStatusCounts);

      // Combine stats from both collections
      const applicantStats = await getApplicantStats(user.uid);
      console.log('Applicant stats:', applicantStats);

      const combinedStats = {
        total: resumeStats.total + applicants.length,
        accepted: resumeStats.shortlisted + applicantStats.shortlisted,
        rejected: resumeStats.rejected + applicantStats.rejected,
        pending: resumeStats.pending + applicantStats.completed + applicantStats.queued + applicantStats.processing,
      };

      console.log('Combined stats:', combinedStats);
      console.log('=== END DEBUG ===');

      // Sort resumes by creation date (newest first)
      const sortedResumes = resumes.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Get recent candidates from resumes (top 4)
      const recentFromResumes = sortedResumes.slice(0, 4).map((resume) => ({
        id: resume.id || "",
        candidateName: resume.candidateName,
        skills: resume.skills,
        atsScore: resume.atsScore,
        status: resume.status,
        createdAt:
          resume.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      }));

      // Generate chart data combining both sources
      const chartData = generateChartData(resumes);

      setData({
        stats: combinedStats,
        chartData,
        recentCandidates: recentFromResumes,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
      // Set empty data on error
      setData({
        stats: { total: 0, accepted: 0, rejected: 0, pending: 0 },
        chartData: [],
        recentCandidates: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stats = data?.stats || {
    total: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Overview of your hiring pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/dashboard/uploads">
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Processed this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.accepted}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Ready for interview
            </p>
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
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Not matching criteria
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pending}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Candidates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Candidates</CardTitle>
              <CardDescription>Latest uploaded resumes</CardDescription>
            </div>
            <Link to="/dashboard/uploads">
              <Button variant="outline" size="sm">
                View All
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : data?.recentCandidates?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
              <h3 className="font-semibold mb-2">No candidates yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Upload your first resume to get started
              </p>
              <Link to="/dashboard/uploads">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.recentCandidates?.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {candidate.candidateName}
                      </span>
                      <Badge className={statusColors[candidate.status]}>
                        {candidate.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] truncate">
                      {candidate.skills.split(",").slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">ATS Score</span>
                      <span className="text-lg font-bold text-[hsl(var(--primary))]">
                        {candidate.atsScore}%
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(candidate.createdAt)}
                    </p>
                  </div>
                  <div className="w-20">
                    <Progress value={candidate.atsScore} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accepted Candidates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Accepted Candidates</CardTitle>
              <CardDescription>Candidates ready for interview</CardDescription>
            </div>
            <Link to="/dashboard/candidates">
              <Button variant="outline" size="sm">
                View All
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : stats.accepted === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
              <h3 className="font-semibold mb-2">No accepted candidates yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Accepted candidates will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.recentCandidates?.filter(c => c.status === 'shortlisted' || c.status === 'accepted').slice(0, 5).map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">
                        {candidate.candidateName}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-600">
                        Accepted
                      </Badge>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] truncate mt-1">
                      {candidate.skills.split(",").slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">ATS Score</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {candidate.atsScore}%
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(candidate.createdAt)}
                    </p>
                  </div>
                  <div className="w-20">
                    <Progress value={candidate.atsScore} className="h-2" />
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
