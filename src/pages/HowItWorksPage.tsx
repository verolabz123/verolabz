import { Link } from "react-router-dom";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Brain,
  Search,
  Bell,
  UserCheck,
  BarChart3,
  Mail,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Upload Resumes",
    description:
      "Drag and drop resumes in any format (PDF, DOCX, TXT). Upload one at a time or in bulk.",
    details: [
      "Supports all common resume formats",
      "Bulk upload for high-volume hiring",
      "Automatic duplicate detection",
    ],
  },
  {
    icon: FileText,
    title: "2. Automatic Parsing",
    description:
      "Our system extracts key information from each resume automatically.",
    details: [
      "Skills and technologies",
      "Work experience and duration",
      "Education and certifications",
      "Contact information",
    ],
  },
  {
    icon: Brain,
    title: "3. AI Scoring",
    description:
      "Each candidate receives an ATS score based on resume quality and completeness.",
    details: [
      "Objective scoring criteria",
      "Customizable weights",
      "Industry benchmarking",
    ],
  },
  {
    icon: Search,
    title: "4. Job Description Matching",
    description:
      "AI compares candidates against your job requirements for best-fit recommendations.",
    details: [
      "Skills gap analysis",
      "Experience level matching",
      "Cultural fit indicators",
    ],
  },
  {
    icon: Bell,
    title: "5. Recruiter Notification",
    description:
      "Get notified when high-match candidates are found or when action is needed.",
    details: [
      "Email notifications",
      "In-app alerts",
      "Slack/Teams integration (coming soon)",
    ],
  },
  {
    icon: UserCheck,
    title: "6. Shortlist Candidates",
    description:
      "Review AI recommendations and shortlist the best candidates with one click.",
    details: [
      "Quick status updates",
      "Add notes and feedback",
      "Share with team members",
    ],
  },
  {
    icon: BarChart3,
    title: "7. Dashboard Updates",
    description:
      "All changes sync in real-time to your dashboard with updated analytics.",
    details: [
      "Pipeline visualization",
      "Time-to-hire tracking",
      "Source analytics",
    ],
  },
  {
    icon: Mail,
    title: "8. Candidate Communication",
    description:
      "Send automated emails to candidates based on their status changes.",
    details: [
      "Application received confirmation",
      "Interview invitations",
      "Status updates",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-[hsl(var(--primary))]/5 to-transparent">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge className="mb-4">How It Works</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              From Upload to Hired in 8 Steps
            </h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              See how FlowHire transforms your hiring process with intelligent
              automation.
            </p>
          </div>
        </section>

        {/* Timeline Steps */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {steps.map((step, i) => (
                <div key={i}>
                  <Card className="border-[hsl(var(--border))] hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center shrink-0 shadow-lg">
                          <step.icon className="h-7 w-7" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {step.title}
                          </CardTitle>
                          <p className="text-[hsl(var(--muted-foreground))] mt-2">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="ml-[4.5rem] grid sm:grid-cols-2 gap-2">
                        {step.details.map((detail, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                            {detail}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center my-4">
                      <ArrowDown className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-8">
                No complex setup required. Create your account, upload your
                first resume, and see FlowHire in action.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  {
                    step: "1",
                    title: "Create Account",
                    desc: "Sign up for free in 30 seconds",
                  },
                  {
                    step: "2",
                    title: "Upload Resume",
                    desc: "Drop a resume to test parsing",
                  },
                  {
                    step: "3",
                    title: "See Results",
                    desc: "View extracted data instantly",
                  },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <Link to="/auth/register">
                <Button size="lg">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
