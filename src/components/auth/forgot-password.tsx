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
import { Loader, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setSent(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email",
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
            {sent
              ? "Check your email for a password reset link"
              : "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to{" "}
                <strong>{email}</strong>. Please check your inbox and follow the
                instructions.
              </p>
              <Button
                onClick={() => router.push("/sign-in")}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
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
