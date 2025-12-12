import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import {
  getUserById,
  updateUser,
  createUser,
  type FirebaseUser,
} from "@/lib/firebase-db";

const plans = [
  {
    id: "free_trial",
    name: "Free Trial",
    price: "$0",
    description: "14-day trial",
    features: ["10 resumes/month", "1 recruiter", "Basic dashboard"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    description: "For small teams",
    features: [
      "50 resumes/month",
      "3 recruiters",
      "Full dashboard",
      "Basic automations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$149/mo",
    description: "For growing teams",
    features: [
      "500 resumes/month",
      "10 recruiters",
      "Advanced analytics",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For large orgs",
    features: [
      "Unlimited resumes",
      "Unlimited users",
      "Custom workflows",
      "Dedicated support",
    ],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>("free_trial");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<
    "upgrade" | "downgrade" | "cancel"
  >("upgrade");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await getUserById(user.uid);

        if (userProfile) {
          setCurrentPlan(userProfile.plan || "free_trial");
        } else {
          // Create profile if it doesn't exist
          const newUserData: Omit<
            FirebaseUser,
            "id" | "createdAt" | "updatedAt"
          > = {
            email: user.email || "",
            name: user.displayName || "",
            company: "",
            role: "",
            plan: "free_trial",
            emailNotifications: true,
          };

          await createUser(newUserData, user.uid);
          setCurrentPlan("free_trial");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({
          title: "Error",
          description: "Failed to load billing information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePlanAction = (
    planId: string,
    action: "upgrade" | "downgrade" | "cancel",
  ) => {
    setSelectedPlan(planId);
    setModalAction(action);
    setShowModal(true);
  };

  const confirmPlanChange = async () => {
    if (!selectedPlan || !user) return;

    setIsUpdating(true);
    try {
      await updateUser(user.uid, { plan: selectedPlan });
      setCurrentPlan(selectedPlan);
      toast({
        title: "Plan Updated",
        description:
          "Your plan has been changed. Note: This is a demo—no actual billing occurred.",
      });
    } catch (error) {
      console.error("Plan update failed:", error);
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setShowModal(false);
    }
  };

  const currentPlanIndex = plans.findIndex((p) => p.id === currentPlan);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlanData = plans.find((p) => p.id === currentPlan);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-1">
              {currentPlanData?.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{currentPlanData?.price}</div>
              <p className="text-muted-foreground">
                {currentPlanData?.description}
              </p>
            </div>
            <ul className="space-y-1">
              {currentPlanData?.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Demo Notice */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="py-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Demo Notice:</strong> This is a demonstration. Billing is
            mocked. Stripe/Razorpay integration will be added later via n8n
            webhooks.
          </p>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = i > currentPlanIndex;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isCurrent ? "border-primary bg-primary/5" : "border-border"
                } ${plan.popular ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                    Popular
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">{plan.price}</div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <ul className="space-y-1 text-sm">
                    {plan.features.slice(0, 3).map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      className="w-full"
                      onClick={() => handlePlanAction(plan.id, "upgrade")}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePlanAction(plan.id, "downgrade")}
                    >
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Downgrade
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cancel Subscription */}
      {currentPlan !== "free_trial" && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-600">Cancel Subscription</CardTitle>
            <CardDescription>
              Downgrade to the free trial. You&apos;ll lose access to premium
              features.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-600 hover:bg-red-500/10"
              onClick={() => handlePlanAction("free_trial", "cancel")}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalAction === "upgrade" && "Upgrade Plan"}
              {modalAction === "downgrade" && "Downgrade Plan"}
              {modalAction === "cancel" && "Cancel Subscription"}
            </DialogTitle>
            <DialogDescription>
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <p className="text-sm mb-2">
                  You are about to{" "}
                  {modalAction === "upgrade"
                    ? "upgrade to"
                    : modalAction === "downgrade"
                      ? "downgrade to"
                      : "cancel and switch to"}{" "}
                  <strong>
                    {plans.find((p) => p.id === selectedPlan)?.name}
                  </strong>
                  .
                </p>
                <p className="text-sm text-muted-foreground">
                  In this demo, billing is mocked. Connect Stripe/Razorpay later
                  via n8n webhooks.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPlanChange} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
