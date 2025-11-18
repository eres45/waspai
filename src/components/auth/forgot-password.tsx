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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader, ChevronLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Password validation
  const passwordValidation = {
    hasMinLength: password.length >= 8 && password.length <= 20,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordValid =
    passwordValidation.hasMinLength &&
    passwordValidation.hasLetter &&
    passwordValidation.hasNumber &&
    password === confirmPassword;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      const data = await response.json();
      toast.success(data.message || "Reset email sent");
      setStep("password");
      setLoading(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email",
      );
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error("Please check password requirements");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "recovery-token",
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      const data = await response.json();
      toast.success(data.message || "Password reset successfully");
      setLoading(false);
      // Redirect to sign-in after successful password reset
      setTimeout(() => {
        router.push("/sign-in");
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <Card className="w-full md:max-w-md bg-background border-none mx-auto shadow-none animate-in fade-in duration-1000">
        <CardHeader className="my-4">
          <CardTitle className="text-2xl text-center my-1">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {step === "email"
              ? "Enter your email to receive a password reset link"
              : "Create a new password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader className="size-4 animate-spin mr-2" />
                ) : null}
                Send Reset Link
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-6"
            >
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password validation checklist */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {passwordValidation.hasMinLength ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                  <span>8-20 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.hasLetter ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                  <span>Contains a letter</span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordValidation.hasNumber ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                  <span>Contains a number</span>
                </div>
                <div className="flex items-center gap-2">
                  {password === confirmPassword && password ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <X className="size-4 text-red-500" />
                  )}
                  <span>Passwords match</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !isPasswordValid}
              >
                {loading ? (
                  <Loader className="size-4 animate-spin mr-2" />
                ) : null}
                Reset Password
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("email")}
                disabled={loading}
              >
                Back
              </Button>
            </form>
          )}

          <Link
            href="/sign-in"
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-4"
          >
            <ChevronLeft className="size-3" />
            Back to Sign In
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
