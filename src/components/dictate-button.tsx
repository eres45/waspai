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
  const baseTextRef = useRef("");

  // Running accumulation of transcription during this session.
  const finalTranscriptRef = useRef("");
  const currentTranscriptRef = useRef<string>("");

  // VAD silence detection refs
  const lastSpeechTimeRef = useRef<number>(0);
  const vadIntervalRef = useRef<any>(null);

  // Stable ref so the recognition handler can call setInputAction without
  // being re-created every render.
  const setInputRef = useRef(setInputAction);
  useEffect(() => {
    setInputRef.current = setInputAction;
  }, [setInputAction]);

  // Check Speech Recognition support on mount.
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    // Snapshot what's already in the input box as the base
    baseTextRef.current = input.trim();
    finalTranscriptRef.current = "";
    currentTranscriptRef.current = "";
    lastSpeechTimeRef.current = Date.now();

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // keep listening until stopped
    recognition.interimResults = true; // get partial words in real-time
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      onListeningChange?.(true);
    };

    recognition.onresult = (event: any) => {
      let interimText = "";
      let hasNewSpeech = false;

      // Walk only the NEW results in this event
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current +=
            (finalTranscriptRef.current ? " " : "") + transcript.trim();
        } else {
          interimText += transcript;
        }
        hasNewSpeech = true;
      }

      if (hasNewSpeech) {
        lastSpeechTimeRef.current = Date.now();
      }

      // Reconstruct the full input
      const base = baseTextRef.current;
      const dictated =
        finalTranscriptRef.current +
        (interimText
          ? (finalTranscriptRef.current ? " " : "") + interimText
          : "");

      const fullText = base + (base && dictated ? " " : "") + dictated;
      currentTranscriptRef.current = dictated;
      setInputRef.current(fullText);
    };

    recognition.onend = () => {
      stopListening();
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Dictate error:", event.error);
      }
      stopListening();
    };

    recognitionRef.current = recognition;

    // Start VAD timer to automatically stop after 2 seconds of silence
    vadIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceSpeech = now - lastSpeechTimeRef.current;
      const dictatedText = currentTranscriptRef.current.trim();

      if (
        lastSpeechTimeRef.current > 0 &&
        timeSinceSpeech > 2000 &&
        dictatedText.length > 0
      ) {
        stopListening();
      }
    }, 300);

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start dictate recognition:", err);
      stopListening();
    }
  }, [input, stopListening, onListeningChange]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_e) {}
      }
    };
  }, []);

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
          {isListening ? "Stop Dictating (VAD active)" : "Dictate Message"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
