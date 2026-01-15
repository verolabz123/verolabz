import { Link } from "react-router-dom";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Brain,
  Workflow,
  BarChart3,
  CreditCard,
  Users,
  Building2,
  Briefcase,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Upload,
  Search,
  UserCheck,
  Bell,
  Mail,
  Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-[hsl(var(--primary))]/5 to-transparent">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Hiring{" "}
                  <span className="text-[hsl(var(--primary))]">Automation</span>{" "}
                  Platform
                </h1>
                <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-lg">
                  Turn manual recruitment into an automated, intelligent workflow.
                  Screen resumes 10x faster with AI-powered parsing and matching.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/auth/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      View Live Demo
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    No credit card required
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    14-day free trial
                  </span>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="relative">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl overflow-hidden">
                  <div className="bg-[hsl(var(--muted))] px-4 py-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Verolabz Dashboard</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-[hsl(var(--primary))]/10 text-center">
                        <div className="text-2xl font-bold text-[hsl(var(--primary))]">247</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Processed</div>
                      </div>
                      <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                        <div className="text-2xl font-bold text-emerald-600">52</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Shortlisted</div>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                        <div className="text-2xl font-bold text-amber-600">18</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">Pending</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: "Sarah Chen", role: "Full Stack Developer", score: 94 },
                        { name: "Michael Park", role: "Backend Engineer", score: 87 },
                        { name: "Emma Wilson", role: "DevOps Engineer", score: 82 },
                      ].map((candidate, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50">
                          <div>
                            <div className="font-medium text-sm">{candidate.name}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">{candidate.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-[hsl(var(--primary))]">{candidate.score}%</div>
                            <Badge variant="success" className="text-xs">Match</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Proposition */}
        <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Verolabz?</h2>
              <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                Everything you need to streamline your hiring process
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FileText,
                  title: "Automated Resume Parsing",
                  description: "Extract skills, experience, and qualifications automatically from any resume format.",
                },
                {
                  icon: Brain,
                  title: "AI-Powered Scoring",
                  description: "Smart algorithms match candidates to job requirements and rank them by fit.",
                },
                {
                  icon: BarChart3,
                  title: "Recruiter Dashboard",
                  description: "Real-time analytics and insights to track your hiring pipeline.",
                },
                {
                  icon: CreditCard,
                  title: "Flexible Pricing",
                  description: "Subscription-based SaaS model with plans for teams of all sizes.",
                },
              ].map((item, i) => (
                <Card key={i} className="bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-[hsl(var(--primary))]" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                Built for modern recruitment teams
              </p>
            </div>

            <div className="space-y-16">
              {/* Resume Processing */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <Badge className="mb-4">Resume Processing</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Automated Resume Processing & Parsing
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Extract skills, experience, designation, and education",
                      "Calculate ATS compatibility scores automatically",
                      "Auto-categorize resumes by job requirements",
                      "Support for PDF, DOCX, and TXT formats",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span className="text-[hsl(var(--muted-foreground))]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-[hsl(var(--primary))]" />
                      </div>
                      <div>
                        <div className="font-semibold">Resume_JohnDoe.pdf</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">Processing complete</div>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between p-2 rounded bg-[hsl(var(--muted))]/50">
                        <span className="text-[hsl(var(--muted-foreground))]">Skills</span>
                        <span className="font-medium">React, Node.js, Python, AWS</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-[hsl(var(--muted))]/50">
                        <span className="text-[hsl(var(--muted-foreground))]">Experience</span>
                        <span className="font-medium">6 years</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-[hsl(var(--muted))]/50">
                        <span className="text-[hsl(var(--muted-foreground))]">ATS Score</span>
                        <span className="font-medium text-emerald-600">92/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Evaluation */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">AI Matching Score</span>
                        <Badge variant="success">High Match</Badge>
                      </div>
                      <div className="h-4 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                        <div className="h-full w-[88%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                      </div>
                      <div className="p-4 rounded-lg bg-[hsl(var(--muted))]/50">
                        <div className="text-sm font-medium mb-2">AI Reasoning:</div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Strong match for Senior Developer role. 6+ years of relevant experience with required tech stack.
                          Leadership experience aligns with team lead responsibilities.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Badge className="mb-4">AI Evaluation</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    AI-Powered Resume Evaluation
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "Score resumes based on custom criteria",
                      "Auto-match candidates to job descriptions",
                      "Get shortlist suggestions with reasoning",
                      "Reduce bias with objective scoring",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                        <span className="text-[hsl(var(--muted-foreground))]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Workflow Automation */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <Badge className="mb-4">
                    <Workflow className="h-3 w-3 mr-1" />
                    Coming Soon
                  </Badge>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">
                    Workflow Automation
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-4">
                    Powered by workflow automation engine. Connect your hiring pipeline to
                    notifications, emails, and third-party integrations.
                  </p>
                  <Badge variant="outline" className="text-[hsl(var(--muted-foreground))]">
                    Connected Workflows (Coming Soon)
                  </Badge>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="rounded-xl border border-[hsl(var(--border))] border-dashed bg-[hsl(var(--muted))]/30 p-6">
                    <div className="flex items-center justify-center h-48 text-[hsl(var(--muted-foreground))]">
                      <div className="text-center">
                        <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Workflow automation coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ideal Users */}
        <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Who Is Verolabz For?</h2>
              <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                Built for anyone who wants to hire smarter, not harder
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  title: "Recruiters & TA Teams",
                  description: "Handle high-volume applications efficiently and focus on top candidates.",
                },
                {
                  icon: Building2,
                  title: "HR SaaS Agencies",
                  description: "Offer automated screening as a value-add service to your clients.",
                },
                {
                  icon: Briefcase,
                  title: "Hiring Consultants",
                  description: "Scale your consulting practice with intelligent automation tools.",
                },
                {
                  icon: Rocket,
                  title: "Startups & SMEs",
                  description: "Compete for top talent without a large HR department.",
                },
              ].map((item, i) => (
                <Card key={i} className="text-center bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-14 w-14 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-7 w-7 text-[hsl(var(--primary))]" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Steps */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                From resume upload to candidate hired in 8 simple steps
              </p>
            </div>
            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-[hsl(var(--border))] -translate-y-1/2" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[
                  { icon: Upload, label: "Upload" },
                  { icon: FileText, label: "Parse" },
                  { icon: Brain, label: "Score" },
                  { icon: Search, label: "Match JD" },
                  { icon: Bell, label: "Notify" },
                  { icon: UserCheck, label: "Shortlist" },
                  { icon: BarChart3, label: "Dashboard" },
                  { icon: Mail, label: "Email" },
                ].map((step, i) => (
                  <div key={i} className="relative flex flex-col items-center">
                    <div className="h-14 w-14 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center relative z-10 shadow-lg">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="mt-3 text-sm font-medium">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center mt-12">
              <Link to="/how-it-works">
                <Button variant="outline" size="lg">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                Choose the plan that fits your hiring needs
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$49",
                  description: "For small teams getting started",
                  features: ["50 resumes/month", "3 recruiters", "Basic analytics"],
                },
                {
                  name: "Pro",
                  price: "$149",
                  description: "For growing teams",
                  features: ["500 resumes/month", "10 recruiters", "Advanced analytics", "Priority support"],
                  popular: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "For large organizations",
                  features: ["Unlimited resumes", "Unlimited users", "Custom workflows", "Dedicated support"],
                },
              ].map((plan, i) => (
                <Card key={i} className={`relative bg-[hsl(var(--card))] border-[hsl(var(--border))] ${plan.popular ? "border-[hsl(var(--primary))] shadow-xl" : ""}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">/mo</span></div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/pricing">
                <Button size="lg">
                  View All Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-[hsl(var(--primary))]">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--primary-foreground))] mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-[hsl(var(--primary-foreground))]/80 max-w-2xl mx-auto mb-8">
              Join hundreds of companies already using Verolabz to hire smarter and faster.
            </p>
            <Link to="/auth/register">
              <Button size="lg" variant="secondary">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
