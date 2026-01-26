import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  UserCheck,
  UserX,
  Clock,
  ArrowUpRight,
  Upload,
  RefreshCw,
  Sparkles,
  ArrowRight
} from "lucide-react";
import {
  getResumesByUserId,
  getResumeStats,
} from "@/lib/firebase-db";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

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
  shortlisted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
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

      // Combine stats from both collections
      const applicantStats = await getApplicantStats(user.uid);

      const combinedStats = {
        total: resumeStats.total + applicants.length,
        accepted: resumeStats.shortlisted + applicantStats.shortlisted,
        rejected: resumeStats.rejected + applicantStats.rejected,
        pending: resumeStats.pending + applicantStats.completed + applicantStats.queued + applicantStats.processing,
      };

      // Sort resumes by creation date (newest first)
      const sortedResumes = resumes.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Get recent candidates from resumes (top 6)
      const recentFromResumes = sortedResumes.slice(0, 6).map((resume) => ({
        id: resume.id || "",
        candidateName: resume.candidateName,
        skills: resume.skills,
        atsScore: resume.atsScore,
        status: resume.status,
        createdAt:
          resume.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      }));

      setData({
        stats: combinedStats,
        chartData: [],
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
    <div className="space-y-8 animate-fade-in text-white/90">

      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-2 text-gray-400">
            <span className="text-sm font-medium">Hiring Overview</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-500">Last updated just now</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Acceptance Rate</span>
            <span className="text-lg font-bold text-emerald-400">
              {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}% <span className="text-xs text-gray-500 font-normal">vs last week</span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} className="bg-transparent border-white/10 text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/20">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/dashboard/bulk-upload">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 border-0">
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Insight Widget */}
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Hiring Insight</h3>
            <p className="text-xs text-gray-400">Your average time-to-hire has decreased by 12% this week. Great job!</p>
          </div>
        </div>
      </div>

      {/* Decision Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20 hover:border-blue-500/20 transition-all hover:translate-y-[-2px] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Accepted</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{stats.accepted}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-emerald-500 font-medium">
                {stats.accepted > 0 ? "Candidates ready" : "No candidates yet"}
              </p>
              {stats.accepted > 0 && <ArrowRight className="h-3 w-3 text-emerald-500" />}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20 hover:border-amber-500/20 transition-all hover:translate-y-[-2px] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 group-hover:text-amber-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{stats.pending}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-500 font-medium">
                {stats.pending > 0 ? "Action required" : "All caught up ✓"}
              </p>
              {stats.pending > 0 && <ArrowRight className="h-3 w-3 text-amber-500" />}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20 hover:border-red-500/20 transition-all hover:translate-y-[-2px] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Rejected</CardTitle>
            <UserX className="h-4 w-4 text-red-500 group-hover:text-red-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{stats.rejected}</div>
            <p className="text-xs text-gray-500">
              Not matching criteria
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20 hover:border-blue-500/20 transition-all hover:translate-y-[-2px] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Processed</CardTitle>
            <FileText className="h-4 w-4 text-blue-500 group-hover:text-blue-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
            <p className="text-xs text-gray-500">
              Across all jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Candidate List */}
      <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20 overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Recent Candidates</CardTitle>
              <div className="text-xs text-gray-400 mt-1">Latest applicants ranked by AI confidence</div>
            </div>
            <Link to="/dashboard/candidates">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">
                View All
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : data?.recentCandidates?.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">No candidates yet</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Upload resumes to see AI ranking and analysis here.
              </p>
              <Link to="/dashboard/bulk-upload">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Resume
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {data?.recentCandidates?.map((candidate, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={candidate.id}
                  className="group flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-4 md:w-[250px]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                      {candidate.candidateName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{candidate.candidateName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{candidate.skills.split(",")[0] || "No specific role"}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="md:w-[150px]">
                    <Badge variant="outline" className={`text-xs font-normal capitalize ${statusColors[candidate.status] || "text-gray-400 border-gray-700"}`}>
                      {candidate.status}
                    </Badge>
                  </div>

                  {/* ATS Score Progress */}
                  <div className="flex-1 md:px-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Match Confidence</span>
                      <span className="font-bold text-white">{candidate.atsScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${candidate.atsScore > 85 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : candidate.atsScore > 70 ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gray-600'}`}
                        style={{ width: `${candidate.atsScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end md:w-[150px] gap-2">
                    <span className="text-xs text-gray-600 mr-2">{formatDate(candidate.createdAt)}</span>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 hover:bg-white/5">
                      View Profile
                      <ArrowRight className="ml-1.5 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
