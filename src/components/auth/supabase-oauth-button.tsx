"use client";

import { supabaseAuth } from "@/lib/auth/supabase-auth";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "ui/github-icon";
import { toast } from "sonner";
import { useState } from "react";
import { Loader } from "lucide-react";

export function GitHubOAuthButton() {
  const [loading, setLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabaseAuth.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message || "Failed to sign in with GitHub");
        setLoading(false);
        return;
      }

      // Redirect happens automatically
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to sign in with GitHub",
      );
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGitHubSignIn}
      className="flex-1 w-full"
      disabled={loading}
    >
      {loading ? (
        <Loader className="size-4 animate-spin mr-2" />
      ) : (
        <GithubIcon className="size-4 fill-foreground" />
      )}
      GitHub
    </Button>
  );
}
