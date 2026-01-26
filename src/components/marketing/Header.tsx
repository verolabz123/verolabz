import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: "/features", label: "Product" },
        { href: "/solutions", label: "Solutions" },
        { href: "/pricing", label: "Pricing" },
        { href: "/resources", label: "Resources" },
    ];

    return (
        <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0B0F14]/80 backdrop-blur-md">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
                            V
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">Verolabz</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/auth/login" className="text-sm font-medium text-white hover:text-gray-300 transition-colors">
                            Sign In
                        </Link>
                        <Link to="/auth/register">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/20 rounded-lg px-4 font-medium">
                                Start Free Trial
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10 bg-[#0B0F14]">
                        <nav className="flex flex-col gap-4 px-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors py-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10">
                                <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full text-white justify-start">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        Start Free Trial
                                    </Button>
                                </Link>
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
