import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    Check,
    Zap,
    Shield,
    BarChart,
    Search,
    Play
} from "lucide-react";

// Animation Definitions
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col font-sans bg-[#0B0F14] text-white selection:bg-blue-500/30">
            <Header />

            <main className="flex-1 overflow-hidden">
                {/* HERO SECTION */}
                <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
                    {/* Background Noise & Gradient */}
                    <div className="absolute inset-0 bg-noise pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] opacity-30 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] opacity-20 pointer-events-none" />

                    <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                        <motion.div
                            initial="initial"
                            animate="animate"
                            variants={stagger}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Badge */}
                            <motion.div variants={fadeInUp} className="flex justify-center mb-8">
                                <Badge variant="secondary" className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 px-3 py-1 text-xs font-normal tracking-wide uppercase backdrop-blur-sm">
                                    Verolabs 2.0 is here
                                </Badge>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                variants={fadeInUp}
                                className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-6 text-balance"
                            >
                                The Hiring OS for <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">High-Performance Teams</span>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p
                                variants={fadeInUp}
                                className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed text-balance"
                            >
                                AI-powered resume screening, candidate matching, and hiring workflows — built for speed, accuracy, and scale.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div
                                variants={fadeInUp}
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                            >
                                <Link to="/auth/register">
                                    <Button size="lg" className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.02]">
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <Link to="/product-tour" className="group flex items-center gap-2 text-gray-300 hover:text-white px-6 py-3 rounded-xl transition-colors font-medium">
                                    View Product Tour <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </motion.div>

                            {/* Trust Signals */}
                            <motion.div
                                variants={fadeInUp}
                                className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center gap-4"
                            >
                                <p className="text-sm text-gray-500 font-medium">SOC-2 ready • GDPR compliant • Enterprise-grade security</p>
                            </motion.div>
                        </motion.div>

                        {/* Hero Image / Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="mt-20 relative max-w-5xl mx-auto"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl blur-lg opacity-50" />
                            <div className="relative rounded-xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl">
                                {/* Insert Placeholder for proper Dashboard Image if available, otherwise construct a minimal UI representation */}
                                <div className="aspect-[16/9] bg-[#0F1218] p-4 md:p-8 flex flex-col">
                                    {/* Mock Browser Header */}
                                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-white/10" />
                                            <div className="w-3 h-3 rounded-full bg-white/10" />
                                            <div className="w-3 h-3 rounded-full bg-white/10" />
                                        </div>
                                        <div className="ml-4 h-6 w-64 rounded bg-white/5" />
                                    </div>

                                    {/* Mock Dashboard Content */}
                                    <div className="flex-1 grid grid-cols-12 gap-6">
                                        {/* Sidebar */}
                                        <div className="hidden md:block col-span-2 space-y-4">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-8 rounded bg-white/5" />)}
                                        </div>
                                        {/* Main Content */}
                                        <div className="col-span-12 md:col-span-10">
                                            <div className="flex justify-between items-end mb-8">
                                                <div>
                                                    <div className="text-sm text-gray-500 mb-1">Active Pipeline</div>
                                                    <div className="text-2xl font-bold">Senior Product Designer</div>
                                                </div>
                                                <div className="h-9 w-32 rounded bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-mono">AI Matching On</div>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Candidate Row 1 (Winner) */}
                                                <div className="flex items-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold mr-4">98</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-white">Sarah Vickers</div>
                                                        <div className="text-sm text-gray-400">Ex-Linear, 7y exp</div>
                                                    </div>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="px-2 py-1 rounded bg-white/5 text-gray-300">Design Systems</span>
                                                        <span className="px-2 py-1 rounded bg-white/5 text-gray-300">Prototyping</span>
                                                    </div>
                                                </div>
                                                {/* Candidate Row 2 */}
                                                <div className="flex items-center p-4 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-bold mr-4">84</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-300">James Chen</div>
                                                        <div className="text-sm text-gray-500">Senior UX, 5y exp</div>
                                                    </div>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="px-2 py-1 rounded bg-white/5 text-gray-500">Research</span>
                                                    </div>
                                                </div>
                                                {/* Candidate Row 3 */}
                                                <div className="flex items-center p-4 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-bold mr-4">72</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-300">Marcus Low</div>
                                                        <div className="text-sm text-gray-500">Visual Designer, 3y exp</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* HOW IT WORKS (Minimal) */}
                <section className="py-24 border-t border-white/5">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                            {[
                                { step: "01", title: "Upload Resumes", desc: "Drag & drop bulk PDF/Word files.", icon: Play },
                                { step: "02", title: "AI Analysis", desc: "Engine extracts data & ranks fit.", icon: Search },
                                { step: "03", title: "Hire Confidently", desc: "Interview the top 10%, ignore noise.", icon: Check },
                            ].map((item, i) => (
                                <div key={i} className="group">
                                    <div className="text-sm font-mono text-gray-600 mb-4 group-hover:text-blue-500 transition-colors">{item.step}</div>
                                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* OUTCOME FOCUSED GRID */}
                <section className="py-32 bg-[#0F1218]">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">Why Verolabs Wins</h2>
                                <div className="space-y-8">
                                    {[
                                        { title: "10x Faster Screening", desc: "Process 1,000+ resumes in the time it takes to read one.", icon: Zap },
                                        { title: "Reduced Hiring Bias", desc: "Score candidates purely on skills and verifiable experience.", icon: Shield },
                                        { title: "Explainable AI", desc: "See exactly why a candidate was ranked #1. No black boxes.", icon: BarChart },
                                    ].map((feat, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="mt-1 p-2 rounded-lg bg-white/5 text-blue-400">
                                                <feat.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-white mb-1">{feat.title}</h4>
                                                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                {/* Visual Abstract */}
                                <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/5 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-noise opacity-10" />
                                    <div className="text-center">
                                        <div className="text-6xl font-bold text-white mb-2">93%</div>
                                        <div className="text-sm text-gray-500 uppercase tracking-widest">Efficiency Gain</div>
                                    </div>
                                    {/* Decorative circles */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/5 rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-white/5 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="py-32 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to regain control?</h2>
                        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            Join the high-performance teams automating their hiring workflow today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth/register">
                                <Button size="lg" className="h-14 px-8 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-lg transition-transform hover:-translate-y-1">
                                    Start 14-Day Free Trial
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
