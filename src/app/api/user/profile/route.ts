import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return mock profile
    const user = {
      id: session.user.id,
      email: session.user.email || "demo@example.com",
      name: session.user.name || "Demo User",
      company: "Demo Corp",
      role: "HR Manager",
      plan: "pro",
      emailNotifications: true,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, company, role, emailNotifications } = body;

    // Mock update - just echo back the new state merged with defaults
    const user = {
      id: session.user.id,
      email: session.user.email || "demo@example.com",
      name: name || session.user.name || "Demo User",
      company: company || "Demo Corp",
      role: role || "HR Manager",
      plan: "pro",
      emailNotifications: emailNotifications ?? true,
    };

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("[PROFILE_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
