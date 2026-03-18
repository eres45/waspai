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
  className?: string;
}

export function DictateButton({
  input,
  setInputAction,
  className,
}: DictateButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Auto-detect: Use browser language by default, which is the most reliable "auto"
    // However, if we want to prioritize Hindi/English, we let the browser handle its preferred input
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setInputAction(input + (input ? " " : "") + finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [input, setInputAction]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (_e) {
        console.error("Failed to start speech recognition", _e);
      }
    }
  }, [isListening]);

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
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0, 0.5],
                }}
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
          {isListening ? "Stop Dictating" : "Start Dictating"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
