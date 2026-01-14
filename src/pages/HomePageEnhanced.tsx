import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    Sparkles,
    Zap,
} from "lucide-react";

// Animation variants
const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 }
};

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-20 md:py-32">
                    {/* Animated Background */}
                    <div className="absolute inset-0 gradient-primary-radial opacity-50" />
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                className="space-y-6"
                                initial="initial"
                                animate="animate"
                                variants={staggerContainer}
                            >
                                <motion.div variants={fadeInUp}>
                                    <Badge variant="secondary" className="mb-4 shadow-premium hover-lift">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Trusted by 500+ Companies
                                    </Badge>
                                </motion.div>

                                <motion.h1
                                    className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                                    variants={fadeInUp}
                                >
                                    SaaS Hiring{" "}
                                    <span className="gradient-text">Automation</span>{" "}
                                    Platform
                                </motion.h1>

                                <motion.p
                                    className="text-xl text-[hsl(var(--muted-foreground))] max-w-lg"
                                    variants={fadeInUp}
                                >
                                    Turn manual recruitment into an automated, intelligent workflow.
                                    Screen resumes 10x faster with AI-powered parsing and matching.
                                </motion.p>

                                <motion.div
                                    className="flex flex-col sm:flex-row gap-4"
                                    variants={fadeInUp}
                                >
                                    <Link to="/auth/register">
                                        <Button size="lg" className="w-full sm:w-auto shadow-premium-lg hover-lift group">
                                            Start Free Trial
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <Link to="/how-it-works">
                                        <Button variant="outline" size="lg" className="w-full sm:w-auto hover-lift">
                                            <Zap className="mr-2 h-4 w-4" />
                                            View Live Demo
                                        </Button>
                                    </Link>
                                </motion.div>

                                <motion.div
                                    className="flex items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]"
                                    variants={fadeInUp}
                                >
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        No credit card required
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        14-day free trial
                                    </span>
                                </motion.div>
                            </motion.div>

                            {/* Dashboard Preview */}
                            <motion.div
                                className="relative"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--primary))] to-purple-600 rounded-2xl opacity-20 blur-2xl animate-pulse-glow"></div>
                                <div className="relative rounded-xl glass-dark shadow-premium-lg overflow-hidden hover-lift">
                                    <div className="bg-[hsl(var(--muted))] px-4 py-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                        <div className="h-3 w-3 rounded-full bg-green-400" />
                                        <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Verolabz Dashboard</span>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { value: "247", label: "Processed", color: "primary" },
                                                { value: "52", label: "Shortlisted", color: "emerald" },
                                                { value: "18", label: "Pending", color: "amber" }
                                            ].map((stat, i) => (
                                                <motion.div
                                                    key={i}
                                                    className={`p-4 rounded-lg bg-${stat.color}-500/10 text-center hover-lift cursor-pointer`}
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                >
                                                    <div className={`text-2xl font-bold text-${stat.color === 'primary' ? '[hsl(var(--primary))]' : `${stat.color}-600`}`}>
                                                        {stat.value}
                                                    </div>
                                                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { name: "Sarah Chen", role: "Full Stack Developer", score: 94 },
                                                { name: "Michael Park", role: "Backend Engineer", score: 87 },
                                                { name: "Emma Wilson", role: "DevOps Engineer", score: 82 },
                                            ].map((candidate, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 rounded-lg glass hover-lift cursor-pointer"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + i * 0.1 }}
                                                    whileHover={{ x: 4 }}
                                                >
                                                    <div>
                                                        <div className="font-medium text-sm">{candidate.name}</div>
                                                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{candidate.role}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-semibold text-[hsl(var(--primary))]">{candidate.score}%</div>
                                                        <Badge variant="success" className="text-xs">Match</Badge>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Core Value Proposition */}
                <section className="py-16 md:py-24 bg-[hsl(var(--muted))]/30">
                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Verolabz?</h2>
                            <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                                Everything you need to streamline your hiring process
                            </p>
                        </motion.div>

                        <motion.div
                            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
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
                                <motion.div key={i} variants={scaleIn}>
                                    <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] hover-lift h-full shadow-premium">
                                        <CardHeader>
                                            <motion.div
                                                className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4"
                                                whileHover={{ rotate: 360, scale: 1.1 }}
                                                transition={{ duration: 0.6 }}
                                            >
                                                <item.icon className="h-6 w-6 text-white" />
                                            </motion.div>
                                            <CardTitle className="text-lg">{item.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>{item.description}</CardDescription>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 md:py-24 gradient-primary relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                    <motion.div
                        className="container mx-auto px-4 md:px-6 text-center relative z-10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Ready to Transform Your Hiring?
                        </h2>
                        <p className="text-white/90 max-w-2xl mx-auto mb-8">
                            Join hundreds of companies already using Verolabz to hire smarter and faster.
                        </p>
                        <Link to="/auth/register">
                            <Button size="lg" variant="secondary" className="shadow-premium-lg hover-lift group">
                                Start Your Free Trial
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
