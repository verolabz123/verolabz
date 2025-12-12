import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  LayoutDashboard,
  Upload,
  Users,
  User,
  CreditCard,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Uploads", href: "/dashboard/uploads", icon: Upload },
  { name: "Candidates", href: "/dashboard", icon: Users, disabled: true },
];

const settingsNavigation = [
  { name: "Profile", href: "/dashboard/settings/profile", icon: User },
  { name: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-[hsl(var(--border))] px-6">
          <Briefcase className="h-7 w-7 text-[hsl(var(--primary))]" />
          <span className="text-xl font-bold">FlowHire</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Main
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.disabled ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                  item.disabled && "cursor-not-allowed opacity-50",
                )}
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.disabled && (
                  <span className="ml-auto text-xs bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}

          <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Settings
          </div>
          {settingsNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Help Section */}
        <div className="border-t border-[hsl(var(--border))] p-4">
          <div className="rounded-lg bg-[hsl(var(--muted))]/50 p-4">
            <h4 className="text-sm font-semibold mb-1">Need Help?</h4>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
              Check our documentation or contact support.
            </p>
            <a
              href="mailto:support@flowhire.io"
              className="text-xs text-[hsl(var(--primary))] hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
