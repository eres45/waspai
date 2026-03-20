"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UIMessageWithCompleted, VoiceChatOptions, VoiceChatSession } from ".";
import { generateUUID } from "lib/utils";
import { TextPart } from "ai";
import { generateSpeech, CustomTTSVoice } from "./custom-tts";

/**
 * Custom Voice Chat Hook using Web Speech API + Custom TTS
 * No OpenAI API key required!
 */
export function useCustomVoiceChat(props?: VoiceChatOptions): VoiceChatSession {
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);

  // Track voice from props - update when props change
  const [voice, setVoice] = useState<string>(
    props?.voice || "en-US-JennyNeural",
  );

  useEffect(() => {
    if (props?.voice) {
      setVoice(props.voice);
    }
  }, [props?.voice]);

  const recognitionRef = useRef<any>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // Streaming TTS state
  const ttsQueue = useRef<string[]>([]);
  const isPlayingQueue = useRef<boolean>(false);
  const sentenceBuffer = useRef<string>("");

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
      const audioUrl = await generateSpeech(sentence, voice as CustomTTSVoice);

      if (!audioElement.current) {
        audioElement.current = new Audio();
      }

      audioElement.current.src = audioUrl;
      audioElement.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingQueue.current = false;

        if (ttsQueue.current.length > 0) {
          playNextInQueue();
        } else {
          setIsAssistantSpeaking(false);
        }
      };

      audioElement.current.onerror = () => {
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

  // Ref to track assistant speaking state inside callbacks without re-creating them
  const isAssistantSpeakingRef = useRef(false);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
      (recognitionRef.current as any).maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsUserSpeaking(true);
        // INTERRUPTION: If user starts speaking, stop AI audio
        if (audioElement.current && !audioElement.current.paused) {
          audioElement.current.pause();
          audioElement.current.src = "";
          ttsQueue.current = [];
          isPlayingQueue.current = false;
          setIsAssistantSpeaking(false);
        }
      };

      recognitionRef.current.onend = () => {
        setIsUserSpeaking(false);
        if (
          recognitionRef.current &&
          isListeningRef.current &&
          !isAssistantSpeakingRef.current
        ) {
          try {
            recognitionRef.current.start();
          } catch (_e) {
            // Already started
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === "no-speech") {
          if (
            isListeningRef.current &&
            recognitionRef.current &&
            !isAssistantSpeakingRef.current
          ) {
            try {
              recognitionRef.current.start();
            } catch (_e) {
              // Already started
            }
          }
        } else {
          setError(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }

        if (finalTranscript) {
          handleUserMessage(finalTranscript.trim());
        }
      };
    }
  }, []);

  useEffect(() => {
    isAssistantSpeakingRef.current = isAssistantSpeaking;

    if (isAssistantSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
    } else if (
      !isAssistantSpeaking &&
      isActive &&
      recognitionRef.current &&
      isListeningRef.current
    ) {
      try {
        recognitionRef.current.start();
      } catch (_e) {}
    }
  }, [isAssistantSpeaking, isActive]);

  const handleUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: UIMessageWithCompleted = {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: text }],
        completed: true,
      };

      // Add user message to state and get fresh history for the API call
      let currentHistory: UIMessageWithCompleted[] = [];
      setMessages((prev) => {
        currentHistory = [...prev, userMessage];
        return currentHistory;
      });

      try {
        const voiceSystemPrompt = `You are a helpful AI assistant. Respond naturally and conversationally. Your current voice identity is ${voice}.`;

        const messageId = generateUUID();
        const requestBody: any = {
          id: messageId,
          messages: currentHistory.map((m) => ({
            id: m.id,
            role: m.role,
            content: (m.parts[0] as TextPart).text,
          })),
          chatModel: {
            provider: "openai-free",
            model: "gpt-4o",
          },
          toolChoice: "auto",
          systemPrompt: voiceSystemPrompt,
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Voice-Chat": "true",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok)
          throw new Error("Failed to get response from chat API");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let assistantText = "";
        const assistantMessage: UIMessageWithCompleted = {
          id: generateUUID(),
          role: "assistant",
          parts: [{ type: "text", text: "" }],
          completed: false,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        let buffer = "";
        sentenceBuffer.current = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value);
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;
              try {
                const data = JSON.parse(jsonStr);
                const content =
                  data.delta ||
                  data.choices?.[0]?.delta?.content ||
                  data.choices?.[0]?.message?.content;
                if (content) {
                  assistantText += content;
                  sentenceBuffer.current += content;

                  // Check if we have a full sentence or enough text to speak
                  // Look for punctuation followed by space or end of line
                  const sentenceMatch =
                    sentenceBuffer.current.match(/[^.!?\n]+[.!?\n]+/);
                  if (sentenceMatch) {
                    const sentence = sentenceMatch[0];
                    sentenceBuffer.current = sentenceBuffer.current.slice(
                      sentence.length,
                    );
                    ttsQueue.current.push(sentence.trim());
                    if (!isPlayingQueue.current) {
                      playNextInQueue();
                    }
                  }

                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                      (lastMsg.parts[0] as TextPart).text = assistantText;
                    }
                    return updated;
                  });
                }
              } catch (_e) {}
            }
          }
        }

        // Handle remaining text in buffer
        if (sentenceBuffer.current.trim()) {
          ttsQueue.current.push(sentenceBuffer.current.trim());
          if (!isPlayingQueue.current) {
            playNextInQueue();
          }
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg) lastMsg.completed = true;
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAssistantSpeaking(false);
      }
    },
    [voice],
  );

  const startListening = useCallback(async () => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition)
        throw new Error("Speech recognition not supported");

      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    if (recognitionRef.current) recognitionRef.current.stop();
    if (audioStream.current) {
      audioStream.current.getTracks().forEach((track) => track.stop());
      audioStream.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    if (isActive || isLoading) return;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    try {
      setIsActive(true);
      setIsLoading(false);
      await startListening();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsActive(false);
      setIsLoading(false);
    }
  }, [isActive, isLoading, startListening]);

  const stop = useCallback(async () => {
    await stopListening();
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.src = "";
    }
    setIsActive(false);
    setIsListening(false);
    setIsLoading(false);
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    isUserSpeaking,
    isAssistantSpeaking,
    isListening,
    isLoading,
    error,
    messages,
    start,
    stop,
    startListening,
    stopListening,
  };
}
