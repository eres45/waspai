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
    <div className="flex items-center justify-center relative w-64 h-64 mx-auto select-none">
      {/* Self-contained CSS Animations */}
      <style>{`
        @keyframes voice-blob-morph {
          0%, 100% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
            transform: scale(0.95) rotate(0deg);
          }
          34% {
            border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%;
            transform: scale(1.05) rotate(120deg);
          }
          67% {
            border-radius: 50% 50% 30% 70% / 40% 60% 40% 60%;
            transform: scale(0.98) rotate(240deg);
          }
        }
        @keyframes voice-pulse-slow {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }
        @keyframes voice-ripple-expand {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        .voice-animate-morph {
          animation: voice-blob-morph 10s ease-in-out infinite;
        }
        .voice-animate-pulse-slow {
          animation: voice-pulse-slow 3s ease-in-out infinite;
        }
        .voice-animate-ripple {
          animation: voice-ripple-expand 1.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
        }
      `}</style>

      {/* SVG gooey filter */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <filter id="voice-gooey">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Ripple background for user speaking */}
      {status === "user-speaking" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-44 h-44 rounded-full bg-emerald-500/10 voice-animate-ripple" />
          <div className="absolute w-44 h-44 rounded-full bg-emerald-500/5 voice-animate-ripple [animation-delay:0.6s]" />
        </div>
      )}

      {/* Ripple background for assistant speaking */}
      {status === "assistant-speaking" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-48 h-48 rounded-full bg-indigo-500/10 voice-animate-ripple" />
          <div className="absolute w-48 h-48 rounded-full bg-indigo-500/5 voice-animate-ripple [animation-delay:0.9s]" />
        </div>
      )}

      {/* Blob container with gooey filter */}
      <div
        className="w-full h-full relative flex items-center justify-center"
        style={{ filter: "url(#voice-gooey)" }}
      >
        {status === "idle" && (
          <>
            <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-violet-600/40 to-fuchsia-600/40 voice-animate-pulse-slow" />
            <div className="absolute w-32 h-32 rounded-full bg-indigo-600/30 voice-animate-pulse-slow [animation-delay:0.5s]" />
          </>
        )}

        {status === "loading" && (
          <>
            <div className="absolute w-36 h-36 rounded-full bg-purple-500/40 animate-pulse duration-[1s]" />
            <div className="absolute w-32 h-32 rounded-full bg-fuchsia-600/30 animate-pulse duration-[0.8s] [animation-delay:0.2s]" />
            <div className="absolute w-28 h-28 rounded-full bg-indigo-600/50 animate-ping duration-[2s]" />
          </>
        )}

        {status === "listening" && (
          <>
            <div className="absolute w-40 h-40 rounded-full bg-cyan-500/30 voice-animate-pulse-slow" />
            <div className="absolute w-36 h-36 rounded-full bg-blue-500/25 voice-animate-pulse-slow [animation-delay:0.4s]" />
            <div className="absolute w-32 h-32 rounded-full bg-sky-600/40" />
          </>
        )}

        {status === "user-speaking" && (
          <>
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-500/50 to-teal-500/50 animate-pulse duration-[0.6s]" />
            <div className="absolute w-36 h-36 rounded-full bg-emerald-600/40 animate-pulse duration-[0.8s] [animation-delay:0.1s]" />
            <div className="absolute w-32 h-32 rounded-full bg-teal-700/60" />
          </>
        )}

        {status === "assistant-speaking" && (
          <>
            <div className="absolute w-44 h-40 bg-gradient-to-tr from-pink-500/50 via-purple-600/50 to-indigo-600/50 voice-animate-morph" />
            <div className="absolute w-36 h-40 bg-gradient-to-bl from-cyan-400/40 via-violet-500/40 to-blue-600/40 voice-animate-morph [animation-delay:2s]" />
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_40px_rgba(139,92,246,0.6)]" />
          </>
        )}
      </div>

      {/* Center status indicator icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md shadow-lg",
            status === "idle" &&
              "bg-violet-950/50 border border-violet-500/40 text-violet-300",
            status === "loading" &&
              "bg-purple-950/50 border border-purple-500/40 text-purple-300",
            status === "listening" &&
              "bg-cyan-950/50 border border-cyan-500/40 text-cyan-300",
            status === "user-speaking" &&
              "bg-emerald-950/50 border border-emerald-500/40 text-emerald-300",
            status === "assistant-speaking" &&
              "bg-indigo-950/50 border border-indigo-500/40 text-indigo-300",
          )}
        >
          {status === "idle" && (
            <div className="w-4 h-4 rounded-full bg-violet-400 animate-pulse" />
          )}
          {status === "loading" && (
            <div className="w-5 h-5 rounded-full border-2 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          )}
          {status === "listening" && (
            <div className="w-6 h-6 flex items-center justify-center gap-0.5">
              <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-[pulse_1s_infinite_delay-100]" />
              <span className="w-0.5 h-4.5 bg-cyan-400 rounded-full animate-[pulse_1.2s_infinite_delay-200]" />
              <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-[pulse_1s_infinite_delay-300]" />
            </div>
          )}
          {status === "user-speaking" && (
            <div className="w-6 h-6 flex items-center justify-center gap-0.75">
              <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite]" />
              <span className="w-1 h-5.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_0.1s]" />
              <span className="w-1 h-4 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_0.2s]" />
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_0.3s]" />
            </div>
          )}
          {status === "assistant-speaking" && (
            <div className="w-6 h-6 flex items-center justify-center gap-0.75">
              <span className="w-1 h-4 bg-indigo-400 rounded-full animate-[pulse_0.4s_infinite]" />
              <span className="w-1 h-2 bg-indigo-400 rounded-full animate-[pulse_0.4s_infinite_0.1s]" />
              <span className="w-1 h-5.5 bg-indigo-400 rounded-full animate-[pulse_0.4s_infinite_0.2s]" />
              <span className="w-1 h-3.5 bg-indigo-400 rounded-full animate-[pulse_0.4s_infinite_0.3s]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
