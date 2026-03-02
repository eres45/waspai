"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Send,
  Bot,
  Smile,
  ChevronDown,
  MoreVertical,
  Sparkles,
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
        parts: [{ type: "text", text: "Hi 👋 How can I help you today?" }],
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
    <Card className="w-full max-w-lg mx-auto h-[600px] flex flex-col overflow-hidden border-white/[0.08] bg-[#161618] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] relative backdrop-blur-3xl">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-md shadow-[0_1px_20px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/50 via-indigo-500/50 to-purple-600/50" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
              <Avatar className="size-11 border border-white/10 ring-2 ring-black/50 relative bg-[#161618]">
                <AvatarImage
                  src="/images/avatars/wasp-logo.jpg"
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold">
                  WA
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-[#161618] rounded-full shadow-lg"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white/40 tracking-wider uppercase">
                  Support
                </span>
                <Sparkles className="size-3 text-blue-400 fill-blue-400/20" />
              </div>
              <div className="text-lg font-bold text-white tracking-tight leading-none mt-0.5">
                Wasp AI
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <MoreVertical className="grow-0 size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <ChevronDown className="grow-0 size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/5 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "flex w-full items-end gap-2",
                m.role === "user" ? "flex-row-reverse" : "flex-row text-left",
              )}
            >
              <div
                className={cn(
                  "max-w-[82%] px-4 py-3 rounded-2xl text-[14.5px] leading-[1.6] shadow-xl",
                  m.role === "user"
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none shadow-blue-500/10"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/90 rounded-bl-none backdrop-blur-md",
                )}
              >
                {m.parts.map((part, i) => (
                  <span key={i} className="whitespace-pre-wrap">
                    {part.type === "text" ? part.text : ""}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && messages[messages.length - 1].role === "user" && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-center gap-3"
          >
            <Avatar className="size-6 border border-white/5">
              <AvatarImage src="/images/avatars/wasp-logo.jpg" />
              <AvatarFallback className="text-[8px]">WA</AvatarFallback>
            </Avatar>
            <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-2xl rounded-bl-none backdrop-blur-md shadow-lg">
              <div className="flex gap-1.5 items-center">
                <span className="size-1.5 bg-blue-500/60 rounded-full animate-bounce"></span>
                <span className="size-1.5 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="size-1.5 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestions Wrapper */}
      {messages.length === 1 && (
        <div className="px-5 py-2 flex flex-wrap gap-2.5 bg-gradient-to-t from-white/[0.02] to-transparent">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestionClick(s)}
              className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.03] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:border-white/10 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Premium Input Section */}
      <div className="p-5 border-t border-white/[0.05] bg-white/[0.01] backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-3">
          <div className="flex items-center gap-3 relative">
            <div className="flex-1 relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Wasp AI..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 pr-14 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all placeholder:text-white/20 relative z-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Smile className="grow-0 size-4" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="size-[46px] rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_15px_-3px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_20px_-3px_rgba(37,99,235,0.5)] transition-all duration-300 active:scale-95 shrink-0"
            >
              <Send className="grow-0 size-5 text-white" />
            </Button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4 text-[11px] font-semibold text-white/20 tracking-widest uppercase">
              <span className="flex items-center gap-1.5 group cursor-help">
                <Bot className="size-3 transition-colors group-hover:text-blue-400" />
                WASP OS
              </span>
              <span className="size-1 bg-white/10 rounded-full"></span>
              <span className="group cursor-help transition-colors hover:text-white/40">
                SECURE END-TO-END
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-white/5 border border-white/10"
                ></span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
