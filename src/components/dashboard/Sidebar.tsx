import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  User,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";

const navigation: Array<{
  name: string;
  href: string;
  icon: any;
  disabled?: boolean;
}> = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Candidates", href: "/dashboard/candidates", icon: Users },
    {
      name: "Bulk Upload",
      href: "/dashboard/bulk-upload",
      icon: FileSpreadsheet,
    },
  ];

const settingsNavigation = [
  { name: "Profile", href: "/dashboard/settings/profile", icon: User },
  { name: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-[#0B0F14]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">V</div>
          <span className="text-lg font-bold text-white tracking-tight">Verolabs</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Main
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.disabled ? "#" : item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#1F2937] text-white border-l-2 border-blue-500" // Active: #1F2937 + accent
                    : "text-gray-400 hover:text-white hover:bg-[#111827]", // Hover: #111827
                  item.disabled && "cursor-not-allowed opacity-50",
                )}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")} />
                {item.name}
              </Link>
            );
          })}

          <div className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Settings
          </div>
          {settingsNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#1F2937] text-white border-l-2 border-blue-500"
                    : "text-gray-400 hover:text-white hover:bg-[#111827]",
                )}
              >
                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User / Bottom - Minimal */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border border-white/10" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@verolabz.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
