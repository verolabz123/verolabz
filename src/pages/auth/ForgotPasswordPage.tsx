import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: "Email Sent!",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send reset email. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[hsl(var(--primary))]/5 to-transparent p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-[hsl(var(--primary))]" />
              <span className="text-2xl font-bold">FlowHire</span>
            </Link>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {emailSent
              ? "Check your email for reset instructions"
              : "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-900 dark:text-emerald-100">
                    Password reset email sent to
                  </p>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  If you don't see the email, check your spam folder or request
                  a new one.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Send Another Email
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-sm text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  to="/auth/login"
                  className="text-sm text-[hsl(var(--primary))] hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/auth/register"
                  className="text-[hsl(var(--primary))] hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
