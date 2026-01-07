"use client";

import { useEffect, useState } from "react";
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
import { formatDate } from "@/lib/utils";
import { getWorkflowStatuses } from "@/lib/workflows";
import {
  FileText,
  UserCheck,
  UserX,
  Clock,
  ArrowUpRight,
  Upload,
  Workflow,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  stats: {
    total: number;
    accepted: number;
    rejected: number;
  };
  chartData: { name: string; value: number }[];
  recentCandidates: {
    id: string;
    candidateName: string;
    skills: string;
    status: "accepted" | "rejected";
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  accepted: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
};

const workflowStatusColors: Record<string, string> = {
  connected: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-amber-500/15 text-amber-600",
  not_configured: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const workflowStatuses = getWorkflowStatuses();

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats || {
    total: 0,
    shortlisted: 0,
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
          <Link href="/uploads">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumes Processed</CardTitle>
            <CardDescription>Last 7 days activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.chartData || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Workflow Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Workflow Status</CardTitle>
              <Workflow className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <CardDescription>Automation pipeline status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflowStatuses.map((workflow, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50"
              >
                <span className="text-sm font-medium">
                  {workflow.name.replace(" Workflow", "")}
                </span>
                <Badge className={workflowStatusColors[workflow.status]}>
                  {workflow.status === "connected" && "Connected"}
                  {workflow.status === "pending" && "Coming Soon"}
                  {workflow.status === "not_configured" && "Not Set"}
                </Badge>
              </div>
            ))}
            <p className="text-xs text-center text-[hsl(var(--muted-foreground))] pt-2">
              {/* TODO: Integrate with n8n workflow here */}
              Workflow automation coming soon
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
            <Link href="/uploads">
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
              <Link href="/uploads">
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
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(candidate.createdAt)}
                    </p>
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
