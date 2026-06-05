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

  const [isSarvamEnabled, setIsSarvamEnabled] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isTranscribingRef = useRef<boolean>(false);

  // Streaming TTS state
  const ttsQueue = useRef<string[]>([]);
  const isPlayingQueue = useRef<boolean>(false);
  const sentenceBuffer = useRef<string>("");

  // VAD state
  const lastSpeechTimeRef = useRef<number>(0);
  const currentTranscriptRef = useRef<string>("");
  const vadIntervalRef = useRef<any>(null);

  // Ref to track assistant speaking state inside callbacks without re-creating them
  const isAssistantSpeakingRef = useRef(false);

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
        recognitionRef.current.stop();
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
      if (!SpeechRecognition)
        throw new Error("Speech recognition not supported");

      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_e) {}
        isListeningRef.current = true;
        setIsListening(true);
      }

      if (isSarvamEnabled && audioStream.current) {
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
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [isSarvamEnabled]);

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
          !isAssistantSpeakingRef.current &&
          !isTranscribingRef.current
        ) {
          startListening();
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
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const combinedInterim = interimTranscript.trim();
        const combinedFinal = finalTranscript.trim();

        if (combinedFinal || combinedInterim.length > 5) {
          lastSpeechTimeRef.current = Date.now();
          currentTranscriptRef.current += finalTranscript;

          if (
            isAssistantSpeakingRef.current &&
            (combinedInterim.length > 8 || combinedFinal.length > 3)
          ) {
            if (audioElement.current && !audioElement.current.paused) {
              audioElement.current.pause();
              audioElement.current.src = "";
              ttsQueue.current = [];
              isPlayingQueue.current = false;
              setIsAssistantSpeaking(false);
              isAssistantSpeakingRef.current = false;
            }
          }
        }
      };
    }
  }, [startListening]);

  useEffect(() => {
    isAssistantSpeakingRef.current = isAssistantSpeaking;

    if (isAssistantSpeaking && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
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
      !isTranscribingRef.current
    ) {
      startListening();
    }
  }, [isAssistantSpeaking, isActive, startListening]);

  // Main Chat API logic

  const handleUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsLoading(true);

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
        const voiceSystemPrompt = `You are a helpful AI assistant. Respond naturally and conversationally. Your current voice identity is ${voice}.`;

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
          chatModel: props?.chatModel || {
            provider: "Meta",
            model: "Llama 3.3 70B Versatile",
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
                const content =
                  data.delta ||
                  data.choices?.[0]?.delta?.content ||
                  data.choices?.[0]?.message?.content;
                if (content) {
                  assistantText += content;
                  sentenceBuffer.current += content;

                  const sentenceMatch = sentenceBuffer.current.match(
                    /[^.!?\n]+[.!?\n]+(?=\s|$)/,
                  );
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
    [
      voice,
      playNextInQueue,
      props?.chatModel?.provider,
      props?.chatModel?.model,
      props?.agentId,
      props?.toolMentions,
      props?.allowedMcpServers,
      props?.allowedAppDefaultToolkit,
      props?.threadId,
    ],
  );

  // VAD Interval Logic
  useEffect(() => {
    if (isActive && !isAssistantSpeaking && !isTranscribingRef.current) {
      vadIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceSpeech = now - lastSpeechTimeRef.current;
        const transcript = currentTranscriptRef.current.trim();

        // DYNAMIC SILENCE: Short sentence -> faster response, Long sentence -> let them pause
        const silenceThreshold = transcript.length < 20 ? 1000 : 1800;

        // If silence detected and we have a transcript, send it
        if (
          lastSpeechTimeRef.current > 0 &&
          timeSinceSpeech > silenceThreshold &&
          transcript.length > 0
        ) {
          const browserTranscript = transcript;
          currentTranscriptRef.current = "";
          lastSpeechTimeRef.current = 0;

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
                    await handleUserMessage(browserTranscript);
                  }
                } else {
                  await handleUserMessage(browserTranscript);
                }
              } catch (err) {
                console.error(
                  "Sarvam voice call STT failed, falling back to Web Speech:",
                  err,
                );
                await handleUserMessage(browserTranscript);
              } finally {
                isTranscribingRef.current = false;
                setIsLoading(false);
              }
            };

            // Stop recording
            try {
              mediaRecorderRef.current.stop();
            } catch (_e) {}
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (_e) {}
            }
          } else {
            handleUserMessage(browserTranscript);
          }
        }
      }, 300);
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
