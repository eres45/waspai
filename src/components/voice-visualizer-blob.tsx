"use client";

import React from "react";
import { cn } from "lib/utils";

interface VoiceVisualizerBlobProps {
  isActive: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  isAssistantSpeaking: boolean;
  isLoading: boolean;
}

export function VoiceVisualizerBlob({
  isActive,
  isListening,
  isUserSpeaking,
  isAssistantSpeaking,
  isLoading,
}: VoiceVisualizerBlobProps) {
  // Determine state
  let status:
    | "idle"
    | "loading"
    | "user-speaking"
    | "assistant-speaking"
    | "listening" = "idle";

  if (!isActive) {
    status = "idle";
  } else if (isLoading) {
    status = "loading";
  } else if (isAssistantSpeaking) {
    status = "assistant-speaking";
  } else if (isUserSpeaking && isListening) {
    status = "user-speaking";
  } else if (isListening) {
    status = "listening";
  }

  return (
    <div className="flex items-center justify-center relative w-72 h-72 md:w-80 md:h-80 mx-auto select-none rounded-full overflow-hidden shadow-2xl transition-all duration-700 bg-background/5 border border-muted/50">
      {/* Dynamic State Glow Background */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-1000 -z-10 opacity-30 blur-2xl scale-95",
          status === "idle" &&
            "bg-gradient-to-tr from-violet-600 to-fuchsia-600 animate-pulse duration-[3s]",
          status === "loading" &&
            "bg-gradient-to-tr from-purple-500 to-indigo-600 animate-pulse duration-[1s]",
          status === "listening" &&
            "bg-gradient-to-tr from-cyan-500 to-blue-500 animate-pulse duration-[2s]",
          status === "user-speaking" &&
            "bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] scale-100",
          status === "assistant-speaking" &&
            "bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 shadow-[0_0_60px_rgba(139,92,246,0.6)] scale-105",
        )}
      />

      {/* Spline 3D Digital Form */}
      <iframe
        src="https://my.spline.design/celestialflowabstractdigitalform-ZTDbcj9auutvM9BeViKnrpjR/"
        frameBorder="0"
        style={{
          pointerEvents: "none",
          border: "none",
          position: "absolute",
          width: "130%",
          height: "130%",
          left: "-15%",
          top: "-15%",
        }}
      />

      {/* Subtle state indicator dot at the bottom center */}
      <div className="absolute bottom-4 flex items-center justify-center pointer-events-none">
        <div
          className={cn(
            "px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all duration-500 border backdrop-blur-md shadow-sm flex items-center gap-1.5",
            status === "idle" &&
              "bg-violet-950/40 border-violet-500/30 text-violet-300",
            status === "loading" &&
              "bg-purple-950/40 border-purple-500/30 text-purple-300",
            status === "listening" &&
              "bg-cyan-950/40 border-cyan-500/30 text-cyan-300",
            status === "user-speaking" &&
              "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
            status === "assistant-speaking" &&
              "bg-indigo-950/40 border-indigo-500/30 text-indigo-300",
          )}
        >
          {status === "idle" && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
          )}
          {status === "loading" && (
            <span className="w-1.5 h-1.5 rounded-full border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-spin border" />
          )}
          {status === "listening" && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
          {status === "user-speaking" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
          )}
          {status === "assistant-speaking" && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          )}
          {status === "user-speaking" ? "Speaking" : status}
        </div>
      </div>
    </div>
  );
}
