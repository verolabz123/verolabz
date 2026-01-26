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
import { LogOut, Settings, User, Bell } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B0F14] px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or Context Title could go here, keeping empty for now to let Page header dominate */}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="h-8 w-[1px] bg-white/10 mx-2" />

        <div className="flex items-center gap-3">
          <Badge
            variant={planInfo?.variant || "secondary"}
            className="hidden md:flex bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-colors"
          >
            {planInfo?.label || "Free Trial"}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-white/5 hover:ring-white/10 transition-all p-0 overflow-hidden">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-medium">
                    {getInitials(user?.displayName || "User")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#111827] border-white/10 text-gray-200" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer">
                <Link
                  to="/dashboard/settings/profile"
                  className="flex items-center"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer">
                <Link
                  to="/dashboard/settings/billing"
                  className="flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
