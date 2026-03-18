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
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Keep a ref to the latest input so the recognition handler always reads
  // the current value without triggering re-initialization of the recognition.
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Initialize Speech Recognition ONCE (no deps that recreate it)
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
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: any) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      const currentInput = inputRef.current;
      // Show interim results immediately for real-time effect
      if (interimText || finalText) {
        const suffix = finalText || interimText;
        setInputAction(currentInput + (currentInput ? " " : "") + suffix);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []); // Run once on mount

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (_e) {
        // Already started in some edge cases — ignore
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
                  scale: [1, 1.5, 1],
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
          {isListening ? "Stop Dictating" : "Dictate Message"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
