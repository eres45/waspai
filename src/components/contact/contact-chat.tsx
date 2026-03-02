"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Smile, ChevronDown, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DefaultChatTransport, UIMessage } from "ai";
import { Markdown } from "@/components/markdown";

/**
 * Utility to enhance message text with @ tags and potentially other rich formats
 */
function enhanceMessageText(text: string) {
  if (!text) return text;

  // Simple @ tagging logic (extend as needed)
  // Maps @tag to /path
  const tagMap: Record<string, string> = {
    "@chat": "/chat",
    "@pricing": "/#pricing",
    "@features": "/#features",
    "@contact": "/contact",
    "@home": "/",
  };

  let enhancedText = text;
  Object.entries(tagMap).forEach(([tag, path]) => {
    // Replace @tag with a markdown link if found
    const regex = new RegExp(tag, "g");
    enhancedText = enhancedText.replace(regex, `[${tag}](${path})`);
  });

  return enhancedText;
}

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

  // suggestions removed for minimalist UI

  return (
    <Card className="w-full mx-auto h-[700px] flex flex-col overflow-hidden border-white/10 bg-[#161618] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative rounded-[32px]">
      {/* Sleek Dark Header */}
      <div className="relative border-b border-white/[0.05] bg-white/[0.02] p-6 shrink-0 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600/30 via-indigo-500/30 to-purple-600/30" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-12 border border-white/10 shadow-lg bg-[#1a1a1c]">
                <AvatarImage
                  src="/images/avatars/wasp-logo.jpg"
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold">
                  WA
                </AvatarFallback>
              </Avatar>
              <div className="absolute top-0 -right-1 size-3 bg-green-500 border-2 border-[#161618] rounded-full shadow-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">
                  Wasp AI
                </span>
                <span className="size-1.5 bg-green-500 rounded-full"></span>
              </div>
              <div className="text-sm font-medium text-white/40">
                Support Assistant
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <MoreVertical className="grow-0 size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <ChevronDown className="grow-0 size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area - Dark Glassmorphism */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "flex w-full",
                m.role === "user" ? "justify-end" : "justify-start text-left",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] px-6 py-4 rounded-[24px] text-[15px] leading-[1.6] shadow-2xl",
                  m.role === "user"
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none shadow-blue-500/10"
                    : "bg-white/[0.03] border border-white/[0.08] text-white/90 rounded-bl-none backdrop-blur-xl",
                )}
              >
                {m.parts.map((part, i) => (
                  <div
                    key={i}
                    className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5"
                  >
                    {part.type === "text" ? (
                      <Markdown>{enhanceMessageText(part.text)}</Markdown>
                    ) : null}
                  </div>
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
            className="flex justify-start"
          >
            <div className="bg-white/[0.03] border border-white/[0.08] px-6 py-4 rounded-[24px] rounded-bl-none backdrop-blur-md shadow-lg">
              <div className="flex gap-2 items-center">
                <span className="size-1.5 bg-blue-500/60 rounded-full animate-bounce"></span>
                <span className="size-1.5 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="size-1.5 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sleek Dark Input Section */}
      <div className="p-8 border-t border-white/[0.05] bg-white/[0.01] backdrop-blur-xl shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Wasp AI a question..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-[20px] px-6 py-5 pr-20 text-[15px] text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all placeholder:text-white/20 shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 text-white/20 hover:text-white hover:bg-white/10 transition-colors rounded-full"
              >
                <Smile className="grow-0 size-5" />
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="size-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="grow-0 size-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-6 text-[10px] font-bold text-white/10 tracking-[0.2em] uppercase">
              <span className="hover:text-white/20 transition-colors cursor-default">
                WASP AI NODE
              </span>
              <span className="size-1.5 bg-white/5 rounded-full"></span>
              <span className="hover:text-white/20 transition-colors cursor-default">
                ENCRYPTED SUPPORT CHANNEL
              </span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1].map((i) => (
                <span key={i} className="size-1 bg-white/5 rounded-full"></span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
