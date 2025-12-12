import { Link } from "react-router-dom";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Brain,
  Workflow,
  BarChart3,
  CreditCard,
  Cloud,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      id: "resume-processing",
      icon: FileText,
      title: "Automated Resume Processing & Parsing",
      description:
        "Transform unstructured resumes into organized, searchable candidate profiles.",
      details: [
        "Extract key information: skills, experience, education, certifications",
        "Calculate ATS compatibility scores automatically",
        "Auto-categorize resumes based on job requirements",
        "Support for multiple formats: PDF, DOCX, TXT",
        "Bulk upload and processing capabilities",
        "Smart duplicate detection",
      ],
    },
    {
      id: "ai-evaluation",
      icon: Brain,
      title: "AI-Powered Resume Evaluation",
      description:
        "Let artificial intelligence do the heavy lifting in candidate assessment.",
      details: [
        "Score resumes against custom criteria",
        "Auto-match candidates to job descriptions",
        "Generate shortlist suggestions with reasoning",
        "Reduce unconscious bias with objective scoring",
        "Continuous learning from your hiring decisions",
        "Customizable scoring weights and criteria",
      ],
    },
    {
      id: "workflow",
      icon: Workflow,
      title: "Workflow Automation",
      badge: "Coming Soon",
      description:
        "Automate your entire hiring pipeline from application to offer.",
      details: [
        "Visual workflow builder",
        "Automated email notifications",
        "Integration with calendars for scheduling",
        "Slack and Teams notifications",
        "Custom triggers and actions",
        "Third-party integrations via webhooks",
      ],
    },
    {
      id: "dashboard",
      icon: BarChart3,
      title: "Recruiter Dashboard & Analytics",
      description:
        "Get complete visibility into your hiring pipeline with real-time insights.",
      details: [
        "Real-time pipeline tracking",
        "Candidate status management",
        "Time-to-hire analytics",
        "Source effectiveness reporting",
        "Team performance metrics",
        "Exportable reports",
      ],
    },
    {
      id: "billing",
      icon: CreditCard,
      title: "Billing & Subscription Management",
      description: "Flexible plans that grow with your team.",
      details: [
        "Transparent usage-based pricing",
        "Self-service plan management",
        "Invoice and payment history",
        "Team member management",
        "Usage alerts and notifications",
        "Enterprise custom plans",
      ],
    },
    {
      id: "storage",
      icon: Cloud,
      title: "Storage & Hosting",
      description: "Enterprise-grade infrastructure for your candidate data.",
      details: [
        "Secure cloud-based storage",
        "Role-based access control",
        "Data encryption at rest and in transit",
        "GDPR and CCPA compliant",
        "Automatic backups",
        "99.9% uptime SLA",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-[hsl(var(--primary))]/5 to-transparent">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge className="mb-4">Features</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Hire Smarter
            </h1>
            <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              A complete suite of tools to automate your hiring process from
              start to finish.
            </p>
          </div>
        </section>

        {/* Features Tabs */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <Tabs defaultValue="resume-processing" className="space-y-8">
              <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto">
                {features.map((feature) => (
                  <TabsTrigger
                    key={feature.id}
                    value={feature.id}
                    className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] px-4 py-2"
                  >
                    <feature.icon className="h-4 w-4 mr-2" />
                    {feature.title.split(" ").slice(0, 2).join(" ")}
                  </TabsTrigger>
                ))}
              </TabsList>

              {features.map((feature) => (
                <TabsContent key={feature.id} value={feature.id}>
                  <Card className="border-[hsl(var(--border))]">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center">
                          <feature.icon className="h-7 w-7 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-2xl">
                              {feature.title}
                            </CardTitle>
                            {feature.badge && (
                              <Badge variant="secondary">{feature.badge}</Badge>
                            )}
                          </div>
                          <CardDescription className="text-base mt-1">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {feature.details.map((detail, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-[hsl(var(--muted-foreground))]">
                              {detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Traditional Hiring vs FlowHire
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                See how automation transforms your hiring process
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div />
                <div className="text-center font-semibold text-[hsl(var(--muted-foreground))]">
                  Traditional
                </div>
                <div className="text-center font-semibold text-[hsl(var(--primary))]">
                  FlowHire
                </div>
              </div>

              {[
                {
                  aspect: "Resume Screening",
                  traditional: "Manual, hours per resume",
                  flowhire: "Automated, seconds per resume",
                },
                {
                  aspect: "Candidate Scoring",
                  traditional: "Subjective, inconsistent",
                  flowhire: "AI-powered, objective",
                },
                {
                  aspect: "Data Entry",
                  traditional: "Manual copy-paste",
                  flowhire: "Auto-extracted & organized",
                },
                {
                  aspect: "Status Updates",
                  traditional: "Email chains, spreadsheets",
                  flowhire: "Real-time dashboard",
                },
                {
                  aspect: "Notifications",
                  traditional: "Manual follow-ups",
                  flowhire: "Automated triggers",
                },
                {
                  aspect: "Scaling",
                  traditional: "Hire more recruiters",
                  flowhire: "Same team, 10x volume",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 gap-4 py-4 border-b border-[hsl(var(--border))]"
                >
                  <div className="font-medium">{row.aspect}</div>
                  <div className="text-center text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-2">
                    <X className="h-4 w-4 text-red-400" />
                    <span className="text-sm">{row.traditional}</span>
                  </div>
                  <div className="text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{row.flowhire}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience These Features?
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
              Start your free trial today and see how FlowHire can transform
              your hiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button size="lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg">
                  View Pricing
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
