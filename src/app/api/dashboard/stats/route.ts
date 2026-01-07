import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock stats
    const totalResumes = 42;
    const accepted = 12;
    const rejected = 30;

    // Mock chart data
    const chartData = [
      { name: "Mon", value: 4 },
      { name: "Tue", value: 7 },
      { name: "Wed", value: 5 },
      { name: "Thu", value: 8 },
      { name: "Fri", value: 12 },
      { name: "Sat", value: 3 },
      { name: "Sun", value: 3 },
    ];

    // Mock recent candidates
    const recentCandidates = [
      {
        id: "1",
        candidateName: "John Doe",
        skills: "React, Node.js, TypeScript",
        status: "accepted",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        candidateName: "Jane Smith",
        skills: "Python, Django, AWS",
        status: "rejected",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "3",
        candidateName: "Alice Johnson",
        skills: "Java, Spring Boot, SQL",
        status: "accepted",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "4",
        candidateName: "Bob Brown",
        skills: "C++, Qt, Embedded",
        status: "rejected",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "5",
        candidateName: "Charlie Davis",
        skills: "Go, Kubernetes, Docker",
        status: "accepted",
        createdAt: new Date(Date.now() - 345600000).toISOString(),
      },
    ];

    return NextResponse.json({
      stats: {
        total: totalResumes,
        accepted,
        rejected,
      },
      chartData,
      recentCandidates,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
