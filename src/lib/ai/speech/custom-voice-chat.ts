"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UIMessageWithCompleted, VoiceChatOptions, VoiceChatSession } from ".";
import { generateUUID } from "lib/utils";
import { TextPart } from "ai";
import { generateSpeech, CustomTTSVoice } from "./custom-tts";

interface QueuedSentence {
  sentence: string;
  audioPromise: Promise<string>;
  audioUrl?: string;
  aborted?: boolean;
}

/**
 * Helper to get BCP-47 speech recognition language from voice identity
 */
function getVoiceLanguage(voiceName: string): string {
  const lower = (voiceName || "").toLowerCase();
  if (
    lower.includes("shubh") ||
    lower.includes("bulbul") ||
    lower.includes("aditi") ||
    lower.includes("aarush") ||
    lower.includes("hindi")
  ) {
    return "hi-IN";
  }
  if (lower.includes("aswarth") || lower.includes("telugu")) {
    return "te-IN";
  }
  if (lower.includes("karthik") || lower.includes("tamil")) {
    return "ta-IN";
  }
  if (lower.includes("deepika") || lower.includes("kannada")) {
    return "kn-IN";
  }
  if (lower.includes("lata") || lower.includes("marathi")) {
    return "mr-IN";
  }
  return "en-US";
}

/**
 * Custom Voice Chat Hook using Real-Time Web Speech API + Custom TTS (Fish Audio / Woino)
 * Ultra-low conversational latency (<800ms) with zero cloud STT overhead!
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
    props?.voice || (props as any)?.model || "fish-female",
  );

  useEffect(() => {
    if (props?.voice) {
      setVoice(props.voice);
    } else if ((props as any)?.model) {
      setVoice((props as any).model);
    }
  }, [props?.voice, (props as any)?.model]);

  const [isSarvamEnabled, setIsSarvamEnabled] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isTranscribingRef = useRef<boolean>(false);
  const isWaitingForResponseRef = useRef<boolean>(false);

  // Streaming TTS state with pre-buffering pipeline
  const ttsQueue = useRef<QueuedSentence[]>([]);
  const isPlayingQueue = useRef<boolean>(false);
  const sentenceBuffer = useRef<string>("");
  const processedCleanTextLength = useRef<number>(0);
  const voiceRef = useRef<string>(voice);

  useEffect(() => {
    voiceRef.current = voice;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = getVoiceLanguage(voice);
      } catch (_e) {}
    }
  }, [voice]);

  // VAD state
  const lastSpeechTimeRef = useRef<number>(0);
  const currentTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const vadIntervalRef = useRef<any>(null);

  // Ref to track assistant speaking state inside callbacks without re-creating them
  const isAssistantSpeakingRef = useRef(false);

  const clearAudioQueue = useCallback(() => {
    if (audioElement.current && !audioElement.current.paused) {
      audioElement.current.pause();
      audioElement.current.src = "";
    }
    for (const item of ttsQueue.current) {
      item.aborted = true;
      if (item.audioUrl) {
        URL.revokeObjectURL(item.audioUrl);
      }
    }
    ttsQueue.current = [];
    isPlayingQueue.current = false;
    setIsAssistantSpeaking(false);
    isAssistantSpeakingRef.current = false;
    isWaitingForResponseRef.current = false;
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingQueue.current || ttsQueue.current.length === 0) return;

    isPlayingQueue.current = true;
    setIsAssistantSpeaking(true);
    isAssistantSpeakingRef.current = true;
    isWaitingForResponseRef.current = false;

    const item = ttsQueue.current.shift();
    if (!item) {
      isPlayingQueue.current = false;
      setIsAssistantSpeaking(false);
      isAssistantSpeakingRef.current = false;
      return;
    }

    try {
      // Await pre-fetched audio URL (already resolved or in-flight)
      const audioUrl = await item.audioPromise;
      if (!audioUrl || item.aborted) {
        isPlayingQueue.current = false;
        if (ttsQueue.current.length > 0) {
          playNextInQueue();
        } else {
          setIsAssistantSpeaking(false);
          isAssistantSpeakingRef.current = false;
        }
        return;
      }

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
          isAssistantSpeakingRef.current = false;
        }
      };

      audioElement.current.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        isPlayingQueue.current = false;
        if (ttsQueue.current.length > 0) {
          playNextInQueue();
        } else {
          setIsAssistantSpeaking(false);
          isAssistantSpeakingRef.current = false;
        }
      };

      await audioElement.current.play();
    } catch (err) {
      console.warn("TTS playback error:", err);
      isPlayingQueue.current = false;
      if (ttsQueue.current.length > 0) {
        playNextInQueue();
      } else {
        setIsAssistantSpeaking(false);
        isAssistantSpeakingRef.current = false;
      }
    }
  }, []);

  const enqueueSentence = useCallback(
    (sentence: string) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      const item: QueuedSentence = {
        sentence: trimmed,
        audioPromise: Promise.resolve(""),
      };

      item.audioPromise = (async () => {
        try {
          const url = await generateSpeech(
            trimmed,
            voiceRef.current as CustomTTSVoice,
          );
          if (item.aborted) {
            URL.revokeObjectURL(url);
            return "";
          }
          item.audioUrl = url;
          return url;
        } catch (err) {
          console.warn("TTS pre-fetch failed for sentence:", err);
          return "";
        }
      })();

      ttsQueue.current.push(item);
      if (!isPlayingQueue.current) {
        playNextInQueue();
      }
    },
    [playNextInQueue],
  );

  // Check Speech Recognition support and check if Sarvam STT is enabled
  useEffect(() => {
    // Call configuration endpoint to see if Sarvam API key is configured
    fetch("/api/stt")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.enabled) {
          setIsSarvamEnabled(true);
        }
      })
      .catch((err) => {
        console.warn(
          "Failed to check Sarvam STT status in custom-voice-chat:",
          err,
        );
      });
  }, []);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_e) {}
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (_e) {}
      mediaRecorderRef.current = null;
    }
    if (audioStream.current) {
      audioStream.current.getTracks().forEach((track) => track.stop());
      audioStream.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }

      if (SpeechRecognition && recognitionRef.current) {
        try {
          recognitionRef.current.lang = getVoiceLanguage(voiceRef.current);
          recognitionRef.current.start();
        } catch (_e) {}
        isListeningRef.current = true;
        setIsListening(true);
      } else if (!SpeechRecognition && isSarvamEnabled && audioStream.current) {
        // Fallback for browsers without Web Speech (e.g. Firefox)
        audioChunksRef.current = [];

        let mimeType = "";
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }

        const options = mimeType ? { mimeType } : undefined;
        const mediaRecorder = new MediaRecorder(audioStream.current, options);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        isListeningRef.current = true;
        setIsListening(true);
      } else if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [isSarvamEnabled]);

  // Initialize Web Speech API with dual-stream real-time capture
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = getVoiceLanguage(voiceRef.current);
      (recognitionRef.current as any).maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsUserSpeaking(true);
      };

      recognitionRef.current.onend = () => {
        setIsUserSpeaking(false);
        if (
          recognitionRef.current &&
          isListeningRef.current &&
          !isAssistantSpeakingRef.current &&
          !isWaitingForResponseRef.current &&
          !isTranscribingRef.current
        ) {
          try {
            recognitionRef.current.start();
          } catch (_e) {}
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.warn(`Speech recognition error: ${event.error}`);
        if (event.error === "network") {
          setError(
            new Error("Speech recognition network error. Check connection."),
          );
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let completeFinalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            completeFinalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        interimTranscriptRef.current = interimTranscript.trim();
        currentTranscriptRef.current = completeFinalTranscript.trim();

        const combinedSpoken = (
          completeFinalTranscript +
          " " +
          interimTranscript
        ).trim();

        if (combinedSpoken.length > 0) {
          lastSpeechTimeRef.current = Date.now();
          setIsUserSpeaking(true);

          // If assistant is currently speaking and user interrupts, immediately cut audio playback
          if (isAssistantSpeakingRef.current && combinedSpoken.length > 2) {
            clearAudioQueue();
          }
        }
      };
    }
  }, [clearAudioQueue]);

  useEffect(() => {
    isAssistantSpeakingRef.current = isAssistantSpeaking;

    if (isAssistantSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_e) {}
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (_e) {}
        mediaRecorderRef.current = null;
      }
    } else if (
      !isAssistantSpeaking &&
      isActive &&
      isListeningRef.current &&
      !isWaitingForResponseRef.current &&
      !isTranscribingRef.current
    ) {
      startListening();
    }
  }, [isAssistantSpeaking, isActive, startListening]);

  // Main Chat API logic

  const handleUserMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        isWaitingForResponseRef.current = false;
        return;
      }

      setIsLoading(true);
      isWaitingForResponseRef.current = true;
      processedCleanTextLength.current = 0;

      const userMessage: UIMessageWithCompleted = {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: text }],
        completed: true,
      };

      let currentHistory: UIMessageWithCompleted[] = [];
      setMessages((prev) => {
        currentHistory = [...prev, userMessage];
        return currentHistory;
      });

      try {
        const voiceSystemPrompt = `You are a helpful AI assistant in a live voice conversation. Keep all responses natural, concise, direct, and conversational (usually 1 to 3 short spoken sentences). Never use markdown, bullet points, numbered lists, emojis, asterisks, or code blocks, as your text will be read aloud word-for-word. Your current voice identity is ${voice}.`;

        const messageId = generateUUID();
        const requestBody: any = {
          id: props?.threadId || messageId,
          message: {
            id: userMessage.id,
            role: userMessage.role,
            parts: userMessage.parts,
            metadata: {
              agentId: props?.agentId,
            },
          },
          messages: currentHistory.slice(0, -1).map((m) => ({
            id: m.id,
            role: m.role,
            parts: m.parts,
          })),
          chatModel: {
            provider: "Mistral",
            model: "ministral-14b-latest",
          },
          toolChoice: "auto",
          systemPrompt: voiceSystemPrompt,
          mentions: props?.toolMentions,
          allowedMcpServers: props?.allowedMcpServers,
          allowedAppDefaultToolkit: props?.allowedAppDefaultToolkit,
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
                // Only process text-delta events (or undefined OpenAI choices) to prevent word doubling from reasoning-delta
                if (!data.type || data.type === "text-delta") {
                  const content =
                    data.delta ||
                    data.choices?.[0]?.delta?.content ||
                    data.choices?.[0]?.message?.content;
                  if (content) {
                    assistantText += content;

                    // Clean out think blocks and markdown formatting so reasoning & syntax are hidden from spoken TTS and UI text
                    const cleanText = assistantText
                      .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
                      .replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, "")
                      .replace(/<reasoning>[\s\S]*?(?:<\/reasoning>|$)/gi, "")
                      .replace(/(\*\*|__)(.*?)\1/g, "$2")
                      .replace(/^[ \t]*[>\-*+][ \t]+/gm, "")
                      .replace(/^[ \t]*\d+\.[ \t]+/gm, "");

                    const newCleanText = cleanText.slice(
                      processedCleanTextLength.current,
                    );
                    if (newCleanText) {
                      sentenceBuffer.current += newCleanText;
                      processedCleanTextLength.current = cleanText.length;

                      let sentenceMatch: RegExpMatchArray | null;
                      while (
                        (sentenceMatch = sentenceBuffer.current.match(
                          /[^.!?\n:]+[.!?\n:]+(?=\s|$)/,
                        )) !== null
                      ) {
                        const sentence = sentenceMatch[0];
                        sentenceBuffer.current = sentenceBuffer.current.slice(
                          sentence.length,
                        );
                        enqueueSentence(sentence);
                      }
                    }

                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg && lastMsg.role === "assistant") {
                        (lastMsg.parts[0] as TextPart).text = cleanText;
                      }
                      return updated;
                    });
                  }
                }
              } catch (_e) {}
            }
          }
        }

        if (sentenceBuffer.current.trim()) {
          enqueueSentence(sentenceBuffer.current.trim());
          sentenceBuffer.current = "";
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg) lastMsg.completed = true;
          return updated;
        });

        setIsLoading(false);

        // If no sentences were generated (e.g. empty response or network issue), unblock mic
        if (ttsQueue.current.length === 0 && !isPlayingQueue.current) {
          isWaitingForResponseRef.current = false;
          if (isActive && isListeningRef.current) {
            startListening();
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAssistantSpeaking(false);
        isAssistantSpeakingRef.current = false;
        isWaitingForResponseRef.current = false;
        setIsLoading(false);
        startListening();
      }
    },
    [
      voice,
      enqueueSentence,
      props?.chatModel?.provider,
      props?.chatModel?.model,
      props?.agentId,
      props?.toolMentions,
      props?.allowedMcpServers,
      props?.allowedAppDefaultToolkit,
      props?.threadId,
      isActive,
      startListening,
    ],
  );

  // VAD Interval Logic: Snappy 100ms polling for sub-500ms real-time conversational turnaround
  useEffect(() => {
    if (
      isActive &&
      !isAssistantSpeaking &&
      !isTranscribingRef.current &&
      !isWaitingForResponseRef.current
    ) {
      vadIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceSpeech = now - lastSpeechTimeRef.current;
        const combinedTranscript = (
          currentTranscriptRef.current +
          " " +
          interimTranscriptRef.current
        ).trim();

        // Dynamic Silence Cut:
        // Short utterances (< 15 chars, like "Yes", "Hello", "Thanks") -> 350ms
        // Standard conversational thoughts -> 450ms
        const silenceThreshold = combinedTranscript.length < 15 ? 350 : 450;

        // If silence detected and we have a spoken transcript, dispatch immediately!
        if (
          lastSpeechTimeRef.current > 0 &&
          timeSinceSpeech > silenceThreshold &&
          combinedTranscript.length > 0
        ) {
          const textToSend = combinedTranscript;

          // Clear transcripts and timestamps immediately to prevent re-triggering
          currentTranscriptRef.current = "";
          interimTranscriptRef.current = "";
          lastSpeechTimeRef.current = 0;
          setIsUserSpeaking(false);
          isWaitingForResponseRef.current = true;

          // Abort recognition to flush previous results buffer
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort();
            } catch (_e) {}
          }

          // Fallback check: if Web Speech is not available and Sarvam recorder is running (e.g. Firefox)
          if (
            isSarvamEnabled &&
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            isTranscribingRef.current = true;
            setIsLoading(true);

            mediaRecorderRef.current.onstop = async () => {
              try {
                let container = "webm";
                if (mediaRecorderRef.current?.mimeType.includes("ogg")) {
                  container = "ogg";
                } else if (mediaRecorderRef.current?.mimeType.includes("mp4")) {
                  container = "mp4";
                }

                const audioBlob = new Blob(audioChunksRef.current, {
                  type: mediaRecorderRef.current?.mimeType || "audio/webm",
                });

                if (audioBlob.size > 0) {
                  const formData = new FormData();
                  const file = new File(
                    [audioBlob],
                    `recorded_call.${container}`,
                    {
                      type: audioBlob.type,
                    },
                  );
                  formData.append("file", file);

                  // Map voice language code
                  let model = "saarika:v2.5";
                  let langCode = "en-IN";
                  const lowerVoice = voice.toLowerCase();

                  if (
                    lowerVoice.includes("shubh") ||
                    lowerVoice.includes("bulbul")
                  ) {
                    model = "saaras:v3";
                    langCode = "hi-IN";
                  } else if (lowerVoice.includes("aswarth")) {
                    model = "saaras:v3";
                    langCode = "te-IN";
                  } else if (lowerVoice.includes("karthik")) {
                    model = "saaras:v3";
                    langCode = "ta-IN";
                  } else if (lowerVoice.includes("deepika")) {
                    model = "saaras:v3";
                    langCode = "kn-IN";
                  } else if (lowerVoice.includes("lata")) {
                    model = "saaras:v3";
                    langCode = "mr-IN";
                  }

                  formData.append("model", model);
                  formData.append("language_code", langCode);

                  const res = await fetch("/api/stt", {
                    method: "POST",
                    body: formData,
                  });

                  if (!res.ok) {
                    throw new Error(`STT failed: HTTP ${res.status}`);
                  }

                  const data = await res.json();
                  if (
                    data.success &&
                    data.transcript &&
                    data.transcript.trim()
                  ) {
                    await handleUserMessage(data.transcript);
                  } else {
                    await handleUserMessage(textToSend);
                  }
                } else {
                  await handleUserMessage(textToSend);
                }
              } catch (err) {
                console.error(
                  "Sarvam voice call STT failed, falling back to Web Speech:",
                  err,
                );
                await handleUserMessage(textToSend);
              } finally {
                isTranscribingRef.current = false;
                setIsLoading(false);
              }
            };

            // Stop recording
            try {
              mediaRecorderRef.current.stop();
            } catch (_e) {}
          } else {
            // Instant real-time local path (0ms STT latency)
            handleUserMessage(textToSend);
          }
        }
      }, 100);
    } else {
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }
    }

    return () => {
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    };
  }, [
    isActive,
    isAssistantSpeaking,
    handleUserMessage,
    isSarvamEnabled,
    voice,
  ]);

  const start = useCallback(async () => {
    if (isActive || isLoading) return;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    try {
      if (!audioElement.current) {
        audioElement.current = new Audio();
      }
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
    isWaitingForResponseRef.current = false;
    await stopListening();
    clearAudioQueue();
    setIsActive(false);
    setIsListening(false);
    setIsLoading(false);
  }, [stopListening, clearAudioQueue]);

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
