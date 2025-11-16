"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DEFAULT_VOICE_TOOLS,
  UIMessageWithCompleted,
  VoiceChatOptions,
  VoiceChatSession,
} from ".";
import { generateUUID } from "lib/utils";
import { TextPart, ToolUIPart } from "ai";
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
  const [voice, setVoice] = useState<string>(props?.voice || "nova");
  
  useEffect(() => {
    if (props?.voice) {
      setVoice(props.voice);
    }
  }, [props?.voice]);

  const recognitionRef = useRef<any>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const isListeningRef = useRef<boolean>(false);

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
      // Increase timeout for longer speech
      (recognitionRef.current as any).maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsUserSpeaking(true);
      };

      recognitionRef.current.onend = () => {
        setIsUserSpeaking(false);
        // Restart listening if still active
        if (recognitionRef.current && isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started, ignore error
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        // Ignore "no-speech" errors - they happen when AI is speaking
        if (event.error === "no-speech") {
          console.log("No speech detected, continuing...");
          // Restart listening if still active
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Already started
            }
          }
        } else {
          setError(new Error(`Speech recognition error: ${event.error}`));
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        console.log(`Speech result event - resultIndex: ${event.resultIndex}, results length: ${event.results.length}`);

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;

          console.log(`Result ${i}: "${transcript}" (final: ${isFinal})`);

          if (isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        console.log(`Interim: "${interimTranscript}", Final: "${finalTranscript}"`);

        if (finalTranscript) {
          const trimmedText = finalTranscript.trim();
          console.log(`Sending to chat: "${trimmedText}"`);
          handleUserMessage(trimmedText);
        }
      };
    }
  }, []);

  const handleUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Add user message
      const userMessage: UIMessageWithCompleted = {
        id: generateUUID(),
        role: "user",
        parts: [
          {
            type: "text",
            text: text,
          },
        ],
        completed: true,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Create a voice-based system prompt for roleplay
        const voiceSystemPrompt = voice && voice !== "nova" 
          ? `You are a helpful AI assistant with the voice personality of ${voice}. Respond naturally and conversationally as if you are ${voice}.`
          : undefined;

        // Send to chat API
        const messageId = generateUUID();
        const requestBody: any = {
          id: messageId,
          message: {
            id: messageId,
            role: "user",
            content: text,
            parts: [
              {
                type: "text",
                text: text,
              },
            ],
          },
          chatModel: {
            provider: "openai-free",
            model: "gpt-4o",
          },
          toolChoice: "auto",
        };

        // Add voice system prompt if available
        if (voiceSystemPrompt) {
          requestBody.systemPrompt = voiceSystemPrompt;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Flag to indicate this is a voice chat session (don't save to history)
            "X-Voice-Chat": "true",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error("Failed to get response from chat API");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let assistantText = "";
        const assistantMessage: UIMessageWithCompleted = {
          id: generateUUID(),
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "",
            },
          ],
          completed: false,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsAssistantSpeaking(true);

        // Read streaming response (SSE format)
        let buffer = "";
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          chunkCount++;
          console.log(`Chunk ${chunkCount}:`, chunk.substring(0, 200));
          buffer += chunk;

          // Parse SSE format: data: {...}\n\n
          const lines = buffer.split("\n");
          buffer = lines[lines.length - 1]; // Keep incomplete line in buffer

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            console.log(`Line ${i}:`, line.substring(0, 100));
            
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6); // Remove "data: " prefix
                if (jsonStr === "[DONE]") {
                  console.log("Received [DONE]");
                  continue;
                }

                const data = JSON.parse(jsonStr);
                console.log("Parsed data:", JSON.stringify(data).substring(0, 200));

                // Extract text from different event types
                if (data.delta) {
                  // Direct delta field (Vercel AI format)
                  assistantText += data.delta;
                  console.log("Added delta:", data.delta);
                } else if (data.choices?.[0]?.delta?.content) {
                  // OpenAI format
                  assistantText += data.choices[0].delta.content;
                  console.log("Added choices delta:", data.choices[0].delta.content);
                } else if (data.choices?.[0]?.message?.content) {
                  // OpenAI message format
                  assistantText += data.choices[0].message.content;
                  console.log("Added message:", data.choices[0].message.content);
                }
              } catch (e) {
                // Ignore JSON parse errors for malformed SSE
                console.error("Failed to parse SSE line:", line, e);
              }
            }
          }

          // Update message in real-time
          if (assistantText) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === "assistant") {
                (lastMsg.parts[0] as TextPart).text = assistantText;
              }
              return updated;
            });
          }
        }

        console.log("Final assistantText:", assistantText, "Length:", assistantText.length);

        // Mark as completed
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg) lastMsg.completed = true;
          return updated;
        });

        // Generate speech from complete response
        try {
          console.log("Generating TTS for complete text:", assistantText);
          const audioUrl = await generateSpeech(
            assistantText,
            voice as CustomTTSVoice
          );

          console.log("Audio URL received:", audioUrl);

          // Proxy the audio through our backend to avoid CORS issues
          const proxyUrl = `/api/audio?url=${encodeURIComponent(audioUrl)}`;
          console.log("Using proxy URL:", proxyUrl);

          // Play audio with retry logic
          if (!audioElement.current) {
            audioElement.current = new Audio();
          }
          
          audioElement.current.src = proxyUrl;
          audioElement.current.crossOrigin = "anonymous";
          
          audioElement.current.onended = () => {
            setIsAssistantSpeaking(false);
          };
          
          audioElement.current.onerror = (error) => {
            console.error("Audio playback error:", error);
            setIsAssistantSpeaking(false);
          };
          
          // Wait a bit for the audio file to be ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            await audioElement.current.play();
          } catch (playError) {
            console.error("Failed to play audio:", playError);
            setIsAssistantSpeaking(false);
          }
        } catch (ttsError) {
          console.error("TTS error:", ttsError);
          setIsAssistantSpeaking(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAssistantSpeaking(false);
      }
    },
    [voice, props?.voice] // Re-run when voice changes
  );

  const startListening = useCallback(async () => {
    try {
      // Check if browser supports Web Speech API
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error(
          "Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari."
        );
      }

      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Microphone access not available. Please check your browser permissions and ensure a microphone is connected."
        );
      }

      if (!audioStream.current) {
        try {
          audioStream.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (micError: any) {
          if (micError.name === "NotFoundError") {
            throw new Error(
              "No microphone found. Please connect a microphone and try again."
            );
          } else if (micError.name === "NotAllowedError") {
            throw new Error(
              "Microphone permission denied. Please allow microphone access in your browser settings."
            );
          } else if (micError.name === "NotReadableError") {
            throw new Error(
              "Microphone is in use by another application. Please close other apps using the microphone."
            );
          }
          throw micError;
        }
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);
      setError(new Error(errorMessage));
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioStream.current) {
        audioStream.current.getTracks().forEach((track) => track.stop());
        audioStream.current = null;
      }
      setIsListening(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
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
    try {
      await stopListening();
      if (audioElement.current) {
        audioElement.current.pause();
        audioElement.current.src = "";
      }
      setIsActive(false);
      setIsListening(false);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
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
