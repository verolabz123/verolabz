import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0B0F14] text-white py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">V</div>
              <span className="text-xl font-bold text-white">Verolabz</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              The intelligent hiring OS for high-growth agencies and teams. Automate screening, reduce bias, and hire faster.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white">Product</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link to="/changelog" className="hover:text-blue-400 transition-colors">Changelog</Link></li>
              <li><Link to="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white">Company</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              <li><a href="mailto:support@verolabz.com" className="hover:text-blue-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Verolabs Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {/* Social icons placeholders */}
            <div className="w-5 h-5 bg-white/10 rounded-full" />
            <div className="w-5 h-5 bg-white/10 rounded-full" />
            <div className="w-5 h-5 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>
    </footer>
  );
}
