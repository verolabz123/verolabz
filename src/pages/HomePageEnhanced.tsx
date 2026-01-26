import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Brain,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Zap,
    Users,
    TrendingUp
} from "lucide-react";

// Animation variants
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 }
};

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20">
            <Header />

            <main className="flex-1 overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/30 rounded-full blur-[120px] animate-float" />
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
                    </div>

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                            {/* Hero Text */}
                            <motion.div
                                className="space-y-8 max-w-2xl"
                                initial="initial"
                                animate="animate"
                                variants={staggerContainer}
                            >
                                <motion.div variants={fadeInUp}>
                                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-medium border border-primary/20 bg-primary/5 text-primary shadow-sm hover:bg-primary/10 transition-colors">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        New: AI Agent for Agencies
                                    </Badge>
                                </motion.div>

                                <motion.h1
                                    className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
                                    variants={fadeInUp}
                                >
                                    Scale Your <br />
                                    <span className="gradient-text">Agency Hiring</span>
                                </motion.h1>

                                <motion.p
                                    className="text-xl text-muted-foreground leading-relaxed max-w-lg"
                                    variants={fadeInUp}
                                >
                                    The all-in-one AI platform designed for high-volume recruitment agencies. Automate screening, match candidates instantly, and close clients faster.
                                </motion.p>

                                <motion.div
                                    className="flex flex-col sm:flex-row gap-4 pt-4"
                                    variants={fadeInUp}
                                >
                                    <Link to="/auth/register">
                                        <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 btn-primary-glow">
                                            Start Free Trial
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link to="/how-it-works">
                                        <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base hover:bg-muted/50">
                                            <Zap className="mr-2 h-4 w-4" />
                                            Book Demo
                                        </Button>
                                    </Link>
                                </motion.div>

                                <motion.div
                                    className="flex items-center gap-6 text-sm text-muted-foreground pt-4"
                                    variants={fadeInUp}
                                >
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                                            </div>
                                        ))}
                                    </div>
                                    <p>Trusted by 500+ agencies</p>
                                </motion.div>
                            </motion.div>

                            {/* Hero Visual - Dashboard Preview */}
                            <motion.div
                                className="relative lg:h-[600px] flex items-center justify-center"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-purple-500/30 rounded-3xl blur-3xl animate-pulse-glow" />

                                <div className="relative w-full max-w-md lg:max-w-full glass rounded-2xl border border-white/20 shadow-2xl overflow-hidden aspect-[4/3] lg:aspect-auto h-full">
                                    <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />

                                    {/* Mock Dashboard UI */}
                                    <div className="relative h-full p-6 flex flex-col gap-6">
                                        {/* Top Bar */}
                                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                                <div className="w-3 h-3 rounded-full bg-green-400" />
                                                <span className="ml-4 text-sm font-medium text-muted-foreground">Agency Dashboard</span>
                                            </div>
                                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Live Sync</Badge>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20">
                                                <div className="text-sm text-muted-foreground">Active Jobs</div>
                                                <div className="text-2xl font-bold mt-1">1,248</div>
                                                <div className="text-xs text-green-600 flex items-center mt-2">
                                                    <TrendingUp className="h-3 w-3 mr-1" /> +12% this week
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-white/20">
                                                <div className="text-sm text-muted-foreground">Candidates Placed</div>
                                                <div className="text-2xl font-bold mt-1">86</div>
                                                <div className="text-xs text-green-600 flex items-center mt-2">
                                                    <TrendingUp className="h-3 w-3 mr-1" /> +5% this week
                                                </div>
                                            </div>
                                        </div>

                                        {/* Candidate List Animation */}
                                        <div className="flex-1 space-y-3 overflow-hidden">
                                            <div className="text-sm font-semibold text-muted-foreground mb-2">Recent Matches</div>
                                            {[
                                                { name: "Sarah Vickers", role: "Sr. Product Designer", match: 98, img: 1 },
                                                { name: "James Chen", role: "Full Stack Lead", match: 95, img: 2 },
                                                { name: "Anita Roy", role: "Marketing Director", match: 92, img: 3 },
                                            ].map((c, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="flex items-center p-3 rounded-lg bg-white/60 dark:bg-black/40 border border-white/10 shadow-sm"
                                                    initial={{ x: -20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 1 + (i * 0.2) }}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-muted mr-3 overflow-hidden">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.img * 55}`} alt={c.name} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{c.name}</div>
                                                        <div className="text-xs text-muted-foreground">{c.role}</div>
                                                    </div>
                                                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                                                        {c.match}% Match
                                                    </Badge>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Clients / Social Proof */}
                <section className="py-10 border-y border-border/50 bg-muted/30">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-6">TRUSTED BY LEADING BRANDS</p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholders for logos - in a real app these would be SVGs */}
                            <div className="h-8 w-32 bg-foreground/20 rounded animate-pulse" />
                            <div className="h-8 w-32 bg-foreground/20 rounded animate-pulse delay-100" />
                            <div className="h-8 w-32 bg-foreground/20 rounded animate-pulse delay-200" />
                            <div className="h-8 w-32 bg-foreground/20 rounded animate-pulse delay-300" />
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 md:py-32 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10" />

                    <div className="container mx-auto px-4 md:px-6">
                        <motion.div
                            className="text-center max-w-3xl mx-auto mb-20"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for High-Performance Recruitment</h2>
                            <p className="text-lg text-muted-foreground">
                                Traditional ATS isn't enough. Give your agency the AI advantage to handle more clients with less active effort.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Brain,
                                    title: "AI Resume Parsing",
                                    desc: "Extract skills, experience, and contact info from thousands of resumes in seconds. No manual entry."
                                },
                                {
                                    icon: Users,
                                    title: "Smart Talent Pools",
                                    desc: "Automatically categorize candidates into searchable pools. Find the perfect fit for future roles instantly."
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Automated Outreach",
                                    desc: "Engage candidates with personalized email sequences that stop when they reply."
                                }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    variants={scaleIn}
                                    initial="initial"
                                    whileInView="animate"
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Card className="h-full bg-background/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-lg">
                                        <CardHeader>
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                                <feature.icon className="h-6 w-6" />
                                            </div>
                                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {feature.desc}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Value Prop / Big Feature */}
                <section className="py-24 bg-zinc-950 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid-pattern-white.svg')] opacity-[0.05]" />
                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">Stop screening manually. <br /><span className="text-primary-foreground/80">Start placing candidates.</span></h2>
                                <div className="space-y-6">
                                    {[
                                        { title: "90% Reduction in Screening Time", desc: "Our AI reads resumes like a human, but at machine speed." },
                                        { title: "Zero Bias Matching", desc: "Evaluate purely on skills and experience, ensuring fair assessment." },
                                        { title: "Seamless Integration", desc: "Connects with your existing tools and job boards easily." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="mt-1 bg-white/10 p-2 rounded-full h-fit">
                                                <CheckCircle2 className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{item.title}</h3>
                                                <p className="text-white/60">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                            <div className="relative">
                                {/* Abstract Visual representation of matching */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px]" />
                                <Card className="relative bg-zinc-900 border-zinc-800 text-zinc-100 p-8">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <div className="text-sm text-zinc-400">Job Requirement</div>
                                            <div className="font-bold text-lg">Senior React Developer</div>
                                        </div>
                                        <Badge variant="outline" className="border-green-500/30 text-green-400">High Priority</Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm text-zinc-400">
                                            <span>Candidate Match Score</span>
                                            <span>94/100</span>
                                        </div>
                                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: "94%" }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                        </div>
                                        <div className="pt-4 grid grid-cols-3 gap-2">
                                            {["React", "TypeScript", "Node.js"].map(skill => (
                                                <div key={skill} className="bg-zinc-800 rounded px-2 py-1 text-xs text-center border border-zinc-700">
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                        <motion.h2
                            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            Ready to modernize your agency?
                        </motion.h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                            Join the fastest-growing network of automated recruitment agencies. Start your 14-day free trial today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth/register">
                                <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105">
                                    Get Started Now
                                </Button>
                            </Link>
                            <Link to="/pricing">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
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
