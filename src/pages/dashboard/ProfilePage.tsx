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
  const [profile, setProfile] = useState<FirebaseUser | null>(null);
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
          setProfile(userProfile);
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
            setProfile(createdProfile);
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

      const updatedProfile = await getUserById(user.uid);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

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
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>{user?.email || profile?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                placeholder="Acme Inc."
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role / Title</Label>
            <Input
              id="role"
              name="role"
              placeholder="HR Manager"
              value={formData.role}
              onChange={handleChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Control how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <p className="text-sm text-muted-foreground">
                Receive email updates about new candidates and status changes
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
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
