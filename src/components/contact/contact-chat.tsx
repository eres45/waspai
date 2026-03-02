"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Send,
  Bot,
  Paperclip,
  Smile,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DefaultChatTransport, UIMessage } from "ai";

export function ContactChat() {
  const [input, setInput] = useState("");
  const { messages, status, sendMessage } = useChat({
    id: "contact-support",
    transport: new DefaultChatTransport({
      api: "/api/chat/contact",
    }),
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [{ type: "text", text: "Hi 👋 How can I help you?" }],
      },
    ] as UIMessage[],
  });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage = input.trim();
      setInput("");

      sendMessage({
        role: "user",
        parts: [{ type: "text", text: userMessage }],
      });
    },
    [input, isLoading, sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInput("");
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: suggestion }],
      });
    },
    [sendMessage],
  );

  const suggestions = [
    "What models are included?",
    "Pricing plans?",
    "How to generate images?",
    "Technical support",
  ];

  return (
    <Card className="w-full max-w-lg mx-auto h-[600px] flex flex-col overflow-hidden border-white/10 bg-[#1A1A1C] shadow-2xl relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="size-12 border-2 border-white/20">
              <AvatarImage src="/images/avatars/wasp-logo.jpg" />
              <AvatarFallback>WA</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-[#1A1A1C] rounded-full"></div>
          </div>
          <div>
            <div className="text-xs opacity-80 font-medium">Chat with</div>
            <div className="text-lg font-bold leading-tight">Wasp Support</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <MoreVertical className="grow-0 size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ChevronDown className="grow-0 size-5" />
          </Button>
        </div>
      </div>

      {/* Online Status Bar */}
      <div className="bg-blue-500/10 border-b border-white/5 px-4 py-2 flex items-center gap-2">
        <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-semibold text-blue-400">
          We are online!
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex w-full",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20"
                    : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none",
                )}
              >
                {m.parts.map((part, i) => (
                  <span key={i}>{part.type === "text" ? part.text : ""}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && messages[messages.length - 1].role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="size-1.5 bg-white/40 rounded-full animate-bounce"></span>
                <span className="size-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="size-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-medium hover:bg-blue-500/10 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-[#1A1A1C] border-t border-white/5">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 group"
        >
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-white/40 hover:text-white"
              >
                <Bot className="grow-0 size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-white/40 hover:text-white"
              >
                <Paperclip className="grow-0 size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-white/40 hover:text-white"
              >
                <Smile className="grow-0 size-4" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="size-11 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 shrink-0"
          >
            <Send className="grow-0 size-5" />
          </Button>
        </form>
        <div className="mt-3 flex items-center justify-between opacity-30">
          <div className="text-[10px] font-medium tracking-wider uppercase">
            Powered by <span className="text-white">Wasp AI</span>
          </div>
          <div className="flex gap-2">
            <span className="size-2 bg-white rounded-full"></span>
            <span className="size-2 bg-white rounded-full"></span>
          </div>
        </div>
      </div>
    </Card>
  );
}
