import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { LogOut, Settings, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { getUserById, createUser, type FirebaseUser } from "@/lib/firebase-db";

const planLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  free_trial: { label: "Free Trial", variant: "secondary" },
  starter: { label: "Starter", variant: "outline" },
  pro: { label: "Pro", variant: "default" },
  enterprise: { label: "Enterprise", variant: "default" },
};

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const profile = await getUserById(user.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Create profile if it doesn't exist
          const newUserData: Omit<
            FirebaseUser,
            "id" | "createdAt" | "updatedAt"
          > = {
            email: user.email || "",
            name: user.displayName || "",
            company: "",
            role: "",
            plan: "free_trial",
            emailNotifications: true,
          };
          await createUser(newUserData, user.uid);
          const createdProfile = await getUserById(user.uid);
          if (createdProfile) {
            setUserProfile(createdProfile);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const plan = userProfile?.plan || "free_trial";
  const planInfo = planLabels[plan] || planLabels.free_trial;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant={planInfo.variant}>{planInfo.label}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                  {user?.displayName
                    ? getInitials(user.displayName)
                    : user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs leading-none text-[hsl(var(--muted-foreground))]">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/dashboard/settings/profile"
                className="cursor-pointer flex items-center"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to="/dashboard/settings/billing"
                className="cursor-pointer flex items-center"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[hsl(var(--destructive))]"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
