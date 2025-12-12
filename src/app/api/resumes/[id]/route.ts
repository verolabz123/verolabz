import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { notifyRecruiter, sendCandidateEmail } from "@/lib/workflows";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mock resume details
        const resume = {
            id,
            userId: session.user.id,
            candidateName: "John Doe",
            fileName: "john_doe_resume.pdf",
            fileUrl: "/uploads/john_doe_resume.pdf",
            skills: "React, Node.js, TypeScript",
            experienceYears: 5,
            atsScore: 85,
            aiReasoning: "Strong match for frontend roles.",
            status: "shortlisted",
            createdAt: new Date().toISOString(),
            notes: [
                {
                    id: "note-1",
                    resumeId: id,
                    note: "Good communication skills",
                    createdAt: new Date().toISOString(),
                },
            ],
        };

        return NextResponse.json({ resume });
    } catch (error) {
        console.error("[RESUME_GET_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { status, note } = body;

        // Mock update
        const updatedResume = {
            id,
            userId: session.user.id,
            candidateName: "John Doe",
            fileName: "john_doe_resume.pdf",
            fileUrl: "/uploads/john_doe_resume.pdf",
            skills: "React, Node.js, TypeScript",
            experienceYears: 5,
            atsScore: 85,
            aiReasoning: "Strong match for frontend roles.",
            status: status || "shortlisted",
            createdAt: new Date().toISOString(),
            notes: note
                ? [
                    {
                        id: `note-${Date.now()}`,
                        resumeId: id,
                        note,
                        createdAt: new Date().toISOString(),
                    },
                    {
                        id: "note-1",
                        resumeId: id,
                        note: "Good communication skills",
                        createdAt: new Date().toISOString(),
                    },
                ]
                : [
                    {
                        id: "note-1",
                        resumeId: id,
                        note: "Good communication skills",
                        createdAt: new Date().toISOString(),
                    },
                ],
        };

        // TODO: Trigger n8n workflow for status change notification
        if (status === "shortlisted") {
            // await notifyRecruiter(id, "shortlisted");
            // await sendCandidateEmail(id, "shortlisted");
        } else if (status === "rejected") {
            // await notifyRecruiter(id, "rejected");
            // await sendCandidateEmail(id, "rejected");
        }

        return NextResponse.json({
            message: "Resume updated successfully",
            resume: updatedResume,
        });
    } catch (error) {
        console.error("[RESUME_PATCH_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mock deletion
        return NextResponse.json({ message: "Resume deleted successfully" });
    } catch (error) {
        console.error("[RESUME_DELETE_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
