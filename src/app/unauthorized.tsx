"use client";

import { Button } from "ui/button";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground relative overflow-hidden font-mono p-4">
      {/* Background Grid Effect */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Spotlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-destructive/5 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        {/* Header Section */}
        <div className="relative mb-8 text-center">
          {/* The Badge */}
          <div className="absolute -top-6 -right-12 rotate-12 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 shadow-lg transform hover:rotate-3 transition-transform duration-300">
            ERR_UNAUTHORIZED
          </div>

          {/* The Big Number */}
          <h1 className="text-[150px] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/20 select-none">
            401
          </h1>

          {/* The Strike-through Effect (Cosmetic line) */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-destructive/50 -rotate-6 blur-[1px]"></div>
        </div>

        {/* Content Box */}
        <div className="w-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 shadow-2xl relative overflow-hidden group">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-destructive/50"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-destructive/50"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-destructive/50"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-destructive/50"></div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2 text-destructive font-bold tracking-widest uppercase text-sm animate-pulse">
              <ShieldAlert className="size-4" />
              Restricted Area
            </div>

            <h2 className="text-2xl font-bold">Access Denied</h2>

            <p className="text-muted-foreground max-w-md">
              You do not have the required administrator privileges to access
              this sector.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="size-4" />
                Go Back
              </Button>
              <Button
                variant="default"
                onClick={() => router.push("/")}
                className="flex items-center gap-2"
              >
                <Home className="size-4" />
                Return to Safety
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
