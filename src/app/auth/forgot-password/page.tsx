"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Briefcase, CheckCircle2, ArrowLeft } from "lucide-react";
import { sendPasswordReset } from "@/lib/firebase-auth-helpers";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--muted))] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-[hsl(var(--primary))]"
          >
            <Briefcase className="h-8 w-8" />
            Verolabz
          </Link>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            Reset your password
          </p>
        </div>

        <Card className="shadow-xl border-[hsl(var(--border))]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Forgot Password?
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <div className="p-4 text-sm text-emerald-600 bg-emerald-500/10 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Email sent successfully!</p>
                  <p className="mt-1 text-emerald-600/80">
                    Check your inbox for password reset instructions. The link
                    will expire in 1 hour.
                  </p>
                </div>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  We&apos;ll send you an email with instructions to reset your
                  password.
                </p>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))] hover:underline font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </CardFooter>
            </form>
          )}

          {success && (
            <CardFooter className="flex flex-col gap-4">
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>

              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                Didn&apos;t receive the email? Try again
              </button>
            </CardFooter>
          )}
        </Card>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-[hsl(var(--primary))] hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
