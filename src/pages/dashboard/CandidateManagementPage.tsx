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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    Mail,
    RefreshCw,
    Check,
    X,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
    getResumesByUserId,
    updateResume,
    getUserProfile,
    type FirebaseResume,
} from "@/lib/firebase-db";
import { sendBulkEmails, type CandidateEmailData, type CompanyInfo } from "@/lib/email-api";

export default function CandidateManagementPage() {
    const { user } = useAuth();
    const [candidates, setCandidates] = useState<FirebaseResume[]>([]);
    const [filteredCandidates, setFilteredCandidates] = useState<FirebaseResume[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingEmails, setIsSendingEmails] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, [user]);

    useEffect(() => {
        filterCandidates();
    }, [selectedRole, candidates]);

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

    const filterCandidates = () => {
        if (selectedRole === "all") {
            setFilteredCandidates(candidates);
        } else {
            // Filter by role if we had role data - for now show all
            setFilteredCandidates(candidates);
        }
    };

    const handleStatusChange = async (
        candidateId: string,
        newStatus: "accepted" | "rejected"
    ) => {
        try {
            await updateResume(candidateId, { status: newStatus });

            // Update local state
            setCandidates(candidates.map(c =>
                c.id === candidateId ? { ...c, status: newStatus } : c
            ));

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

    const handleSendEmails = async (type: "accepted" | "rejected") => {
        const targetCandidates = filteredCandidates.filter(
            (c) => c.status === type
        );

        if (targetCandidates.length === 0) {
            toast({
                title: "No Candidates",
                description: `No ${type} candidates to send emails to`,
                variant: "destructive",
            });
            return;
        }

        setIsSendingEmails(true);

        try {
            // Get user profile for company info
            if (!user) throw new Error("User not authenticated");

            const userProfile = await getUserProfile(user.uid);

            // Prepare company info
            const companyInfo: CompanyInfo = {
                companyName: userProfile?.companyName || "Your Company",
                hrName: userProfile?.name || user.displayName || "HR Team",
                hrEmail: userProfile?.email || user.email || "hr@company.com",
                companyWebsite: userProfile?.companyWebsite,
            };

            // Prepare candidate email data
            const candidateEmails: CandidateEmailData[] = targetCandidates.map(c => ({
                name: c.candidateName,
                email: c.fileName || "candidate@example.com", // TODO: Add email field to resume
                jobRole: "Software Developer", // TODO: Add jobRole field to resume
            }));

            // Send bulk emails
            const result = await sendBulkEmails(
                candidateEmails,
                type,
                companyInfo
            );

            if (result.failed > 0) {
                toast({
                    title: "Partially Sent",
                    description: `${result.sent} emails sent successfully, ${result.failed} failed`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Emails Sent Successfully",
                    description: `${type === "accepted" ? "Acceptance" : "Rejection"} emails sent to ${result.sent} candidate(s)`,
                });
            }
        } catch (error: any) {
            console.error("Failed to send emails:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send emails",
                variant: "destructive",
            });
        } finally {
            setIsSendingEmails(false);
        }
    };

    const acceptedCount = filteredCandidates.filter((c) => c.status === "accepted").length;
    const rejectedCount = filteredCandidates.filter((c) => c.status === "rejected").length;

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

            {/* Filter and Actions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Filters & Actions</CardTitle>
                            <CardDescription>
                                {filteredCandidates.length} candidate(s) | {acceptedCount} accepted | {rejectedCount} rejected
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendEmails("accepted")}
                                disabled={acceptedCount === 0 || isSendingEmails}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Send to {acceptedCount} Accepted
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendEmails("rejected")}
                                disabled={rejectedCount === 0 || isSendingEmails}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Send to {rejectedCount} Rejected
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="w-64">
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="frontend">Frontend Developer</SelectItem>
                                    <SelectItem value="backend">Backend Developer</SelectItem>
                                    <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                    ) : filteredCandidates.length === 0 ? (
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
                                {filteredCandidates.map((candidate) => (
                                    <TableRow key={candidate.id}>
                                        <TableCell className="font-medium">
                                            {candidate.candidateName}
                                        </TableCell>
                                        <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                                            {/* Email would come from extended data */}
                                            -
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
                                                    variant={candidate.status === "accepted" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleStatusChange(candidate.id!, "accepted")}
                                                    disabled={candidate.status === "accepted"}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={candidate.status === "rejected" ? "destructive" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleStatusChange(candidate.id!, "rejected")}
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
