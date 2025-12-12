import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


const validPlans = ["free_trial", "starter", "pro", "enterprise"];

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { plan } = body;

        if (!plan || !validPlans.includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan" },
                { status: 400 }
            );
        }

        // TODO: Integrate with Stripe/Razorpay for actual payment processing
        // This is where you would:
        // 1. Create/update Stripe subscription
        // 2. Process payment via n8n webhook
        // 3. Handle billing webhooks for success/failure

        // Mock update
        const user = {
            id: session.user.id,
            email: session.user.email,
            plan,
        };

        return NextResponse.json({
            message: `Plan updated to ${plan}. Note: This is a demo. Stripe/Razorpay integration to be added later.`,
            user,
        });
    } catch (error) {
        console.error("[PLAN_PATCH_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
