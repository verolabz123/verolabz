import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { parseResume, isValidResumeFormat } from "@/lib/resume-parser";
import { triggerResumeWorkflow, notifyRecruiter } from "@/lib/workflows";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock resumes list
    const resumes = [
      {
        id: "1",
        candidateName: "John Doe",
        fileName: "john_doe_resume.pdf",
        fileUrl: "/uploads/john_doe_resume.pdf",
        skills: "React, Node.js, TypeScript",
        experienceYears: 5,
        atsScore: 85,
        aiReasoning: "Strong match for frontend roles.",
        status: "shortlisted",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        candidateName: "Jane Smith",
        fileName: "jane_smith_resume.docx",
        fileUrl: "/uploads/jane_smith_resume.docx",
        skills: "Python, Django, AWS",
        experienceYears: 3,
        atsScore: 92,
        aiReasoning: "Excellent backend skills.",
        status: "pending",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("[RESUMES_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!VALID_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: PDF, DOC, DOCX, TXT" },
        { status: 400 },
      );
    }

    // Validate file extension
    if (!isValidResumeFormat(file.name)) {
      return NextResponse.json(
        { error: "Invalid file format. Supported: PDF, DOCX, TXT" },
        { status: 400 },
      );
    }

    // TODO: Upload file to Firebase Storage
    // For now, use a mock file URL
    const mockFileUrl = `/uploads/${Date.now()}-${file.name}`;

    // Mock resume processing
    const resume = {
      id: `mock-resume-${Date.now()}`,
      userId: session.user.id,
      candidateName: "New Candidate",
      fileName: file.name,
      fileUrl: mockFileUrl,
      skills: "JavaScript, HTML, CSS",
      experienceYears: 2,
      atsScore: 75,
      aiReasoning: "Good potential but needs more experience.",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // TODO: Trigger n8n workflow for resume processing
    // await triggerResumeWorkflow(resume.id);

    // TODO: Trigger n8n workflow for recruiter notification
    // await notifyRecruiter(resume.id, "new_upload");

    return NextResponse.json({
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (error) {
    console.error("[RESUMES_POST_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
