import { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, RefreshCw, Check, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  getResumesByUserId,
  updateResume,
  type FirebaseResume,
} from "@/lib/firebase-db";

export default function CandidateManagementPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<FirebaseResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  const fetchCandidates = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const resumes = await getResumesByUserId(user.uid);
      setCandidates(resumes);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    candidateId: string,
    newStatus: "accepted" | "rejected",
  ) => {
    try {
      await updateResume(candidateId, { status: newStatus });

      // Update local state
      setCandidates(
        candidates.map((c) =>
          c.id === candidateId ? { ...c, status: newStatus } : c,
        ),
      );

      toast({
        title: "Status Updated",
        description: `Candidate marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-emerald-500/15 text-emerald-600";
      case "rejected":
        return "bg-red-500/15 text-red-600";
      case "pending":
        return "bg-amber-500/15 text-amber-600";
      default:
        return "bg-gray-500/15 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidate Management</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Review and manage candidates by role
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCandidates}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>



      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>
            All candidates with their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
              <h3 className="font-semibold mb-2">No candidates found</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Upload candidates via Bulk Upload to see them here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>ATS Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">
                      {candidate.candidateName}
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                      {/* Email would come from extended data */}-
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {candidate.skills.split(",").slice(0, 3).join(", ")}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-[hsl(var(--primary))]">
                        {candidate.atsScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant={
                            candidate.status === "accepted"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(candidate.id!, "accepted")
                          }
                          disabled={candidate.status === "accepted"}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            candidate.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(candidate.id!, "rejected")
                          }
                          disabled={candidate.status === "rejected"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
