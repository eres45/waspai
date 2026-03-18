"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DictateButtonProps {
  input: string;
  setInputAction: (value: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
}

export function DictateButton({
  input,
  setInputAction,
  onListeningChange,
  className,
}: DictateButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Snapshot of the text that was already in the box BEFORE dictation started.
  // This never changes mid-session.
  const baseTextRef = useRef("");

  // Running accumulation of FINAL (committed) transcription during this session.
  const finalTranscriptRef = useRef("");

  // Stable ref so the recognition handler can call setInputAction without
  // being re-created every render.
  const setInputRef = useRef(setInputAction);
  useEffect(() => {
    setInputRef.current = setInputAction;
  }, [setInputAction]);

  // Initialize Speech Recognition ONCE on mount.
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // keep listening until stopped
    recognition.interimResults = true; // get partial words in real-time
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: any) => {
      let interimText = "";

      // Walk only the NEW results in this event (from resultIndex onward)
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Add a space between words, not at start
          finalTranscriptRef.current +=
            (finalTranscriptRef.current ? " " : "") + transcript.trim();
        } else {
          interimText += transcript;
        }
      }

      // Reconstruct the full input:
      //   [original text before we started] + [committed words] + [partial word]
      const base = baseTextRef.current;
      const dictated =
        finalTranscriptRef.current +
        (interimText
          ? (finalTranscriptRef.current ? " " : "") + interimText
          : "");
      setInputRef.current(base + (base && dictated ? " " : "") + dictated);
    };

    recognition.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Dictate error:", event.error);
        setIsListening(false);
        onListeningChange?.(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []); // Run once

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      onListeningChange?.(false);
    } else {
      // Snapshot what's already in the input box as the base
      baseTextRef.current = input.trim();
      finalTranscriptRef.current = "";

      try {
        recognition.start();
        setIsListening(true);
        onListeningChange?.(true);
      } catch (_e) {
        // May throw if already started in certain browsers, safe to ignore
      }
    }
  }, [isListening, input]);

  if (!isSupported) return null;

  return (
    <div className={cn("flex items-center", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-300",
                isListening
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 ring-2 ring-red-500/20"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isListening ? "mic-on" : "mic-off"}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Mic className="size-4" />
                </motion.div>
              </AnimatePresence>
            </Button>

            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full bg-red-500/20 -z-10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isListening ? "Stop Dictating" : "Dictate Message"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
