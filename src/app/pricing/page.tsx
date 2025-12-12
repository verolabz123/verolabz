"use client";

import { useState } from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";

const plans = [
    {
        name: "Free Trial",
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: "Try FlowHire risk-free",
        features: [
            "10 resumes/month",
            "1 recruiter",
            "Basic dashboard",
            "Email support",
            "14-day trial period",
        ],
        cta: "Start Free Trial",
        popular: false,
    },
    {
        name: "Starter",
        monthlyPrice: 49,
        yearlyPrice: 39,
        description: "For small teams getting started",
        features: [
            "50 resumes/month",
            "3 recruiters",
            "Full dashboard access",
            "Basic automations",
            "Email support",
            "Resume parsing",
            "ATS scoring",
        ],
        cta: "Choose Starter",
        popular: false,
    },
    {
        name: "Pro",
        monthlyPrice: 149,
        yearlyPrice: 119,
        description: "For growing teams",
        features: [
            "500 resumes/month",
            "10 recruiters",
            "Advanced analytics",
            "All automations",
            "Priority support",
            "AI matching",
            "Custom scoring criteria",
            "API access",
        ],
        cta: "Choose Pro",
        popular: true,
    },
    {
        name: "Enterprise",
        monthlyPrice: null,
        yearlyPrice: null,
        description: "For large organizations",
        features: [
            "Unlimited resumes",
            "Unlimited recruiters",
            "Custom workflows",
            "Dedicated support",
            "SSO integration",
            "Custom integrations",
            "SLA guarantee",
            "On-premise option",
        ],
        cta: "Contact Sales",
        popular: false,
    },
];

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");

    const handlePlanSelect = (planName: string) => {
        setSelectedPlan(planName);
        setShowBillingModal(true);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero */}
                <section className="py-16 md:py-24 bg-gradient-to-b from-[hsl(var(--primary))]/5 to-transparent">
                    <div className="container mx-auto px-4 md:px-6 text-center">
                        <Badge className="mb-4">Pricing</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
                            Choose the plan that fits your hiring needs. No hidden fees.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4">
                            <Label htmlFor="billing-toggle" className={!isYearly ? "font-semibold" : "text-[hsl(var(--muted-foreground))]"}>
                                Monthly
                            </Label>
                            <Switch
                                id="billing-toggle"
                                checked={isYearly}
                                onCheckedChange={setIsYearly}
                            />
                            <Label htmlFor="billing-toggle" className={isYearly ? "font-semibold" : "text-[hsl(var(--muted-foreground))]"}>
                                Yearly
                                <Badge variant="success" className="ml-2">Save 20%</Badge>
                            </Label>
                        </div>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {plans.map((plan, i) => (
                                <Card
                                    key={i}
                                    className={`relative flex flex-col ${plan.popular
                                            ? "border-[hsl(var(--primary))] shadow-xl scale-105"
                                            : "border-[hsl(var(--border))]"
                                        }`}
                                >
                                    {plan.popular && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            Most Popular
                                        </Badge>
                                    )}
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        <div className="mt-4">
                                            {plan.monthlyPrice !== null ? (
                                                <>
                                                    <span className="text-4xl font-bold">
                                                        ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                                    </span>
                                                    <span className="text-[hsl(var(--muted-foreground))]">/mo</span>
                                                    {isYearly && plan.monthlyPrice > 0 && (
                                                        <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                                            Billed annually (${plan.yearlyPrice * 12}/year)
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-3xl font-bold">Custom</span>
                                            )}
                                        </div>
                                        <CardDescription className="mt-2">{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, j) => (
                                                <li key={j} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            variant={plan.popular ? "default" : "outline"}
                                            onClick={() => handlePlanSelect(plan.name)}
                                        >
                                            {plan.cta}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Frequently Asked Questions
                            </h2>
                        </div>
                        <div className="max-w-3xl mx-auto space-y-6">
                            {[
                                {
                                    q: "Can I change my plan later?",
                                    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
                                },
                                {
                                    q: "What happens if I exceed my resume limit?",
                                    a: "We'll notify you when you're approaching your limit. You can upgrade your plan or wait until the next billing cycle.",
                                },
                                {
                                    q: "Do you offer refunds?",
                                    a: "Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.",
                                },
                                {
                                    q: "What payment methods do you accept?",
                                    a: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers.",
                                },
                            ].map((faq, i) => (
                                <Card key={i} className="border-[hsl(var(--border))]">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <HelpCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
                                            {faq.q}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-[hsl(var(--muted-foreground))]">{faq.a}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 md:py-24">
                    <div className="container mx-auto px-4 md:px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Still Have Questions?
                        </h2>
                        <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
                            Our team is here to help you find the right plan for your needs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="mailto:sales@flowhire.io">
                                <Button size="lg" variant="outline">
                                    Contact Sales
                                </Button>
                            </a>
                            <Link href="/auth/register">
                                <Button size="lg">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            {/* Billing Modal */}
            <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Plan Selected: {selectedPlan}</DialogTitle>
                        <DialogDescription>
                            <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--muted))]">
                                <p className="text-sm">
                                    In this demo, billing is mocked. In the production version, this would connect to
                                    Stripe or Razorpay for secure payment processing.
                                </p>
                                <p className="text-sm mt-2 text-[hsl(var(--muted-foreground))]">
                                    To continue with this plan, please register for an account first.
                                </p>
                            </div>
                            <div className="mt-6 flex gap-4">
                                <Button variant="outline" onClick={() => setShowBillingModal(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Link href="/auth/register" className="flex-1">
                                    <Button className="w-full">
                                        Register Now
                                    </Button>
                                </Link>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}
