"use client";

import { Button } from "@/components/ui/button";
import { GithubIcon } from "ui/github-icon";
import { toast } from "sonner";
import { useState } from "react";
import { Loader } from "lucide-react";
import { signInWithGitHubAction } from "@/app/api/auth/actions";

export function GitHubOAuthButton() {
  const [loading, setLoading] = useState(false);

  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGitHubAction();

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      // Redirect happens automatically via server action
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
