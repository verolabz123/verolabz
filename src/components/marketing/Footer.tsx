import { Link } from "react-router-dom";
import { Briefcase } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-[hsl(var(--primary))]" />
              <span className="text-lg font-bold">FlowHire</span>
            </Link>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Automate resume screening. Hire 10x faster.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li>
                <Link
                  to="/features"
                  className="hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li>
                <span className="cursor-not-allowed">Documentation</span>
              </li>
              <li>
                <span className="cursor-not-allowed">API Reference</span>
              </li>
              <li>
                <span className="cursor-not-allowed">Blog</span>
              </li>
              <li>
                <span className="cursor-not-allowed">Changelog</span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li>
                <span className="cursor-not-allowed">About</span>
              </li>
              <li>
                <a
                  href="mailto:support@flowhire.io"
                  className="hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <span className="cursor-not-allowed">Privacy Policy</span>
              </li>
              <li>
                <span className="cursor-not-allowed">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[hsl(var(--border))]">
          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} FlowHire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
