"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";
import { Button } from "ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { cn } from "lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DictateButtonProps {
  input: string;
  setInputAction: (value: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  className?: string;
  editorRef?: React.RefObject<any>;
}

export function DictateButton({
  input,
  setInputAction,
  onListeningChange,
  className,
  editorRef,
}: DictateButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isSarvamEnabled, setIsSarvamEnabled] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

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

  // Check Speech Recognition support and check if Sarvam STT is enabled
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    // Call configuration endpoint to see if Sarvam API key is configured
    fetch("/api/stt")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.enabled) {
          setIsSarvamEnabled(true);
        }
      })
      .catch((err) => {
        console.warn("Failed to check Sarvam STT config status:", err);
      });
  }, []);

  const stopListening = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    // Stop native SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
      recognitionRef.current = null;
    }

    // Stop MediaRecorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (_e) {}
      mediaRecorderRef.current = null;
    }

    setIsListening(false);
    onListeningChange?.(false);
  }, [onListeningChange]);

  const startWebSpeechFallback = useCallback(() => {
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

      const editor = editorRef?.current;
      if (editor) {
        editor.chain().setContent(fullText).focus("end").run();
      } else {
        setInputRef.current(fullText);
      }
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
  }, [input, stopListening, onListeningChange, editorRef]);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Determine supported container types
      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        // Release the microphone stream immediately
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        if (audioBlob.size === 0) return;

        // Perform Speech-to-Text API proxy call
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          const extension = mimeType
            ? mimeType.split("/")[1].split(";")[0]
            : "webm";
          const file = new File([audioBlob], `recorded_audio.${extension}`, {
            type: audioBlob.type,
          });

          formData.append("file", file);

          // Language detection logic
          const browserLang = navigator.language || "en-US";
          let model = "saarika:v2.5";
          let langCode = "en-IN"; // English (India) default

          if (browserLang.startsWith("hi")) {
            model = "saaras:v3";
            langCode = "hi-IN";
          } else if (browserLang.startsWith("ta")) {
            model = "saaras:v3";
            langCode = "ta-IN";
          } else if (browserLang.startsWith("te")) {
            model = "saaras:v3";
            langCode = "te-IN";
          } else if (browserLang.startsWith("kn")) {
            model = "saaras:v3";
            langCode = "kn-IN";
          } else if (browserLang.startsWith("mr")) {
            model = "saaras:v3";
            langCode = "mr-IN";
          }

          formData.append("model", model);
          formData.append("language_code", langCode);

          const response = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(
              `STT request failed with status: ${response.status}`,
            );
          }

          const result = await response.json();
          if (result.success && result.transcript) {
            const base = input.trim();
            const text = result.transcript.trim();
            const fullText = base ? `${base} ${text}` : text;

            const editor = editorRef?.current;
            if (editor) {
              editor.chain().setContent(fullText).focus("end").run();
            } else {
              setInputRef.current(fullText);
            }
          }
        } catch (err) {
          console.error(
            "Sarvam STT failed, trying native Web Speech fallback...",
            err,
          );
          // Auto-fallback
          startWebSpeechFallback();
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      onListeningChange?.(true);
    } catch (err) {
      console.error(
        "Failed to start MediaRecorder, falling back to Web Speech:",
        err,
      );
      startWebSpeechFallback();
    }
  }, [input, onListeningChange, startWebSpeechFallback, editorRef]);

  const startListening = useCallback(() => {
    if (isSarvamEnabled) {
      startRecording();
    } else {
      startWebSpeechFallback();
    }
  }, [isSarvamEnabled, startRecording, startWebSpeechFallback]);

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
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isSupported && !isSarvamEnabled) return null;

  return (
    <div className={cn("flex items-center", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              disabled={isTranscribing}
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-300",
                isListening
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 ring-2 ring-red-500/20"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    isTranscribing
                      ? "loading"
                      : isListening
                        ? "mic-on"
                        : "mic-off"
                  }
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  {isTranscribing ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>

            {isListening && !isTranscribing && (
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
          {isTranscribing
            ? "Transcribing voice..."
            : isListening
              ? isSarvamEnabled
                ? "Stop Dictating (Recording)"
                : "Stop Dictating (VAD active)"
              : "Dictate Message"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
