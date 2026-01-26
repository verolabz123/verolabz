import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, User } from "lucide-react";
import {
  getUserById,
  updateUser,
  createUser,
  type FirebaseUser,
} from "@/lib/firebase-db";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    role: "",
    emailNotifications: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await getUserById(user.uid);

        if (userProfile) {
          setFormData({
            name: userProfile.name || "",
            company: userProfile.company || "",
            role: userProfile.role || "",
            emailNotifications: userProfile.emailNotifications,
          });
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
            setFormData({
              name: createdProfile.name || "",
              company: createdProfile.company || "",
              role: createdProfile.role || "",
              emailNotifications: createdProfile.emailNotifications,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(user.uid, {
        name: formData.name,
        company: formData.company,
        role: formData.role,
        emailNotifications: formData.emailNotifications,
      });

      await getUserById(user.uid);
      // Removed unused setProfile call

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status Insight - Premium Addition */}
      <div className="rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Account Status</h3>
            <p className="text-xs text-gray-400">
              Free Trial • <span className="text-white font-medium">12 days remaining</span>
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-7 border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
          Upgrade to unlock bulk uploads
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          Account & preferences
        </h1>
        <p className="text-gray-400">
          Manage your account control center and notification settings
        </p>
      </div>

      <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/20">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-gray-500">Primary account details</CardDescription>
            </div>
          </div>
          <p className="hidden sm:block text-xs text-gray-600 font-mono">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="bg-[#0B0F14] border-white/10 text-white placeholder:text-gray-700 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-300">Company Name</Label>
              <Input
                id="company"
                name="company"
                placeholder="e.g. Verolabz Technologies"
                value={formData.company}
                onChange={handleChange}
                className="bg-[#0B0F14] border-white/10 text-white placeholder:text-gray-700 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">Role at Company</Label>
            <Input
              id="role"
              name="role"
              placeholder="e.g. Senior Talent Acquisition Manager"
              value={formData.role}
              onChange={handleChange}
              className="bg-[#0B0F14] border-white/10 text-white placeholder:text-gray-700 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </CardContent>

        {/* Integrated Footer Action */}
        <div className="flex items-center justify-end p-4 bg-[#0B0F14]/50 border-t border-white/5 rounded-b-xl">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </Card>

      <div className="space-y-2 pt-4">
        <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
        <p className="text-sm text-gray-400">Stay informed without the noise</p>
      </div>

      <Card className="bg-[#111827] border-white/5 shadow-xl shadow-black/20">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
            <div className="space-y-1">
              <div className="font-medium text-white">Email Notifications</div>
              <p className="text-sm text-gray-500">
                Get updates when candidates are shortlisted or rejected
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  emailNotifications: checked,
                }))
              }
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Placeholder (for future) */}
      {/* <div className="pt-8 border-t border-white/5"> ... </div> */}

    </div>
  );
}

