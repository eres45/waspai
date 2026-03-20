"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UIMessage } from "ai";
import { UseChatHelpers } from "@ai-sdk/react";
import { generateSpeech, CustomTTSVoice } from "./custom-tts";
import { generateUUID } from "lib/utils";
import { toast } from "sonner";

interface UseInlineVoiceProps {
  messages: UIMessage[];
  sendMessageAction: UseChatHelpers<UIMessage>["sendMessage"];
  setMessagesAction: UseChatHelpers<UIMessage>["setMessages"];
  isLoading: boolean;
  voice?: CustomTTSVoice;
}

export function useInlineVoice({
  messages,
  sendMessageAction,
  setMessagesAction,
  isLoading,
  voice = "alloy",
}: UseInlineVoiceProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioStream = useRef<MediaStream | null>(null);

  // Timing metadata
  const userSpeechStartTime = useRef<number>(0);
  const userSpeechEndTime = useRef<number>(0);

  // TTS Chunking state
  const lastProcessedMessageId = useRef<string | null>(null);
  const lastProcessedCharIndex = useRef<number>(0);
  const ttsQueue = useRef<string[]>([]);
  const isPlayingQueue = useRef<boolean>(false);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const currentAssistantMessageId = useRef<string | null>(null);
  const assistantSpeechStartTime = useRef<number>(0);

  // Buffer to accumulate incoming stream chunks before identifying a complete sentence
  const sentenceBuffer = useRef<string>("");
  const isFirstSentenceEmitted = useRef<boolean>(false);

  const startListening = useCallback(async () => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser.");
      }

      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      let finalTranscript = "";
      userSpeechStartTime.current = Date.now();

      // Mark the current last message as "processed" so we don't read history
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        lastProcessedMessageId.current = lastMsg.id;
        // Also treat it as processed for text index
        const textPart = lastMsg.parts.find((p) => p.type === "text") as any;
        if (textPart?.text) {
          lastProcessedCharIndex.current = textPart.text.length;
        }
      } else {
        lastProcessedMessageId.current = "__empty__";
        lastProcessedCharIndex.current = 0;
      }

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsActive(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let tempFinal = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            tempFinal += event.results[i][0].transcript + " ";
          }
        }
        if (tempFinal) {
          finalTranscript += tempFinal;
          // Stop listening automatically after a final result is captured
          // (Can be adjusted for continuous conversation, but for typical "walkie-talkie" or single-turn voice, this works well)
          recognitionRef.current?.stop();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setIsActive(false);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (finalTranscript.trim()) {
          userSpeechEndTime.current = Date.now();
          const durationSecs = (
            (userSpeechEndTime.current - userSpeechStartTime.current) /
            1000
          ).toFixed(1);

          // Submit the message
          sendMessageAction({
            id: generateUUID(),
            role: "user",
            parts: [{ type: "text", text: finalTranscript.trim() }],
            metadata: {
              isVoice: true,
              userVoiceDuration: durationSecs,
            },
          });

          // Reset TTS processor for new response
          lastProcessedCharIndex.current = 0;
          lastProcessedMessageId.current = null;
          sentenceBuffer.current = "";
          isFirstSentenceEmitted.current = false;
          ttsQueue.current = [];
          assistantSpeechStartTime.current = Date.now();
        } else {
          // If active, restart (unless stopped intentionally)
          if (isActive) {
            setIsActive(false);
          }
        }
      };

      recognitionRef.current.start();
    } catch (err: any) {
      toast.error(err.message || "Microphone access failed");
      setIsListening(false);
      setIsActive(false);
    }
  }, [isActive, sendMessageAction, messages]);

  const stopListening = useCallback(() => {
    setIsActive(false);
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.src = "";
    }
    setIsAssistantSpeaking(false);
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingQueue.current || ttsQueue.current.length === 0) return;

    isPlayingQueue.current = true;
    setIsAssistantSpeaking(true);

    const sentence = ttsQueue.current.shift();
    if (!sentence) {
      isPlayingQueue.current = false;
      return;
    }

    try {
      const audioUrl = await generateSpeech(sentence, voice);

      if (!audioElement.current) {
        audioElement.current = new Audio();
      }

      audioElement.current.src = audioUrl;
      audioElement.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingQueue.current = false;

        // If queue is empty, and the LLM stream has finished (indicated by some condition, usually just waiting)
        // We handle total duration updates elsewhere
        if (ttsQueue.current.length > 0) {
          playNextInQueue();
        } else {
          setIsAssistantSpeaking(false);
          // Auto-restart listening for continuous chat
          if (isActive) {
            startListening();
          }
        }
      };

      audioElement.current.onerror = (e) => {
        console.error("Audio playback error", e);
        URL.revokeObjectURL(audioUrl);
        isPlayingQueue.current = false;
        playNextInQueue();
      };

      await audioElement.current.play();
    } catch (err) {
      console.error("TTS Queue error", err);
      isPlayingQueue.current = false;
      playNextInQueue();
    }
  }, [voice]);

  // Watch the messages stream for active Voice Chat responses
  useEffect(() => {
    if (!isActive) return;

    const lastMessage = messages[messages.length - 1];

    // Process only if it's an assistant message and we are actively in a voice session
    if (
      lastMessage?.role === "assistant" &&
      lastMessage.id !== lastProcessedMessageId.current
    ) {
      const parts = lastMessage.parts;
      const textPart = parts.find((p) => p.type === "text") as any;

      if (!textPart || !textPart.text) return;

      const fullText = textPart.text;

      // If it's a new message, reset tracking
      if (currentAssistantMessageId.current !== lastMessage.id) {
        currentAssistantMessageId.current = lastMessage.id;
        lastProcessedCharIndex.current = 0;
        sentenceBuffer.current = "";
        isFirstSentenceEmitted.current = false;
      }

      // Accumulate the entire text stream without splitting
      if (fullText.length > lastProcessedCharIndex.current) {
        lastProcessedCharIndex.current = fullText.length;
        sentenceBuffer.current = fullText;
      }

      // If message is complete (not streaming), queue the entire text once
      if (!isLoading) {
        if (sentenceBuffer.current.trim()) {
          ttsQueue.current.push(sentenceBuffer.current.trim());
          sentenceBuffer.current = "";
          playNextInQueue();
        }

        // Add metadata to the message to show total TTS generation duration
        const durationSecs = (
          (Date.now() - assistantSpeechStartTime.current) /
          1000
        ).toFixed(1);

        // We only want to update metadata once per message
        const currentMetadata: any = lastMessage.metadata || {};
        if (
          !currentMetadata.isVoice ||
          currentMetadata.assistantVoiceDuration !== durationSecs
        ) {
          setMessagesAction((prev) => {
            const updated = [...prev];
            const msgIndex = updated.findIndex((m) => m.id === lastMessage.id);
            if (msgIndex !== -1) {
              updated[msgIndex] = {
                ...updated[msgIndex],
                metadata: {
                  ...Object(updated[msgIndex].metadata || {}),
                  isVoice: true,
                  assistantVoiceDuration: durationSecs,
                },
              };
            }
            return updated;
          });
        }
      }
    }
  }, [messages, isActive, isLoading, playNextInQueue, setMessagesAction]);

  return {
    isActive,
    isListening,
    isAssistantSpeaking,
    startListening,
    stopListening,
  };
}
