"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { Loader2, Save, User } from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    role: string | null;
    plan: string;
    emailNotifications: boolean;
}

export default function ProfileSettingsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
            try {
                const res = await fetch("/api/user/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                    setFormData({
                        name: data.user.name || "",
                        company: data.user.company || "",
                        role: data.user.role || "",
                        emailNotifications: data.user.emailNotifications,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
                toast({ title: "Success", description: "Profile updated successfully", variant: "success" });
            } else {
                throw new Error("Failed to update profile");
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                <p className="text-[hsl(var(--muted-foreground))]">
                    Manage your account information
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                            <User className="h-6 w-6 text-[hsl(var(--primary-foreground))]" />
                        </div>
                        <div>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>{profile?.email}</CardDescription>
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
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Receive email updates about new candidates and status changes
                            </p>
                        </div>
                        <Switch
                            checked={formData.emailNotifications}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, emailNotifications: checked }))
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
