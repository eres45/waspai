"use client";

import { isToolUIPart, type UIMessage } from "ai";
import { memo, useMemo } from "react";
import equal from "lib/equal";

import { cn } from "lib/utils";
import type { UseChatHelpers } from "@ai-sdk/react";
import {
  UserMessagePart,
  AssistMessagePart,
  ToolMessagePart,
  ReasoningPart,
  FileMessagePart,
  SourceUrlMessagePart,
} from "./message-parts";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChatMetadata } from "app-types/chat";
import {
  stripReasoning,
  isLeakyReasoningModel,
} from "lib/ai/reasoning-detector";

interface Props {
  message: UIMessage;
  prevMessage?: UIMessage;
  threadId?: string;
  isLoading?: boolean;
  isLastMessage?: boolean;
  setMessages?: UseChatHelpers<UIMessage>["setMessages"];
  sendMessage?: UseChatHelpers<UIMessage>["sendMessage"];
  className?: string;
  addToolResult?: UseChatHelpers<UIMessage>["addToolResult"];
  messageIndex?: number;
  status?: UseChatHelpers<UIMessage>["status"];
  readonly?: boolean;
}

const PurePreviewMessage = ({
  message,
  prevMessage,
  readonly,
  threadId,
  isLoading,
  isLastMessage,
  status,
  className,
  setMessages,
  addToolResult,
  messageIndex,
  sendMessage,
}: Props) => {
  const isUserMessage = message.role === "user";
  const modelId = (message.metadata as ChatMetadata)?.chatModel?.model || "";

  // Process message parts to extract reasoning from leaky models
  const partsForDisplay = useMemo(() => {
    // Only process assistant messages from leaky models
    const isLeaky = isLeakyReasoningModel(modelId);
    if (message.role !== "assistant" || !isLeaky) {
      return message.parts.filter(
        (part) => !(part.type === "text" && (part as any).ingestionPreview),
      );
    }

    console.log(
      "[Reasoning Debug] Processing leaky model:",
      modelId,
      "isLeaky:",
      isLeaky,
    );

    const processedParts: typeof message.parts = [];

    for (const part of message.parts) {
      // Only process text parts
      if (part.type === "text" && typeof part.text === "string") {
        // Filter out ingestionPreview parts even if processing for reasoning
        if ((part as any).ingestionPreview) {
          continue;
        }

        const { reasoning, cleanText, hasReasoning } = stripReasoning(
          part.text,
          modelId,
        );

        if (hasReasoning && reasoning) {
          // Add reasoning part first
          processedParts.push({
            type: "reasoning",
            text: reasoning,
          } as any);

          // Add clean text part if exists
          if (cleanText.trim()) {
            processedParts.push({
              ...part,
              text: cleanText,
            });
          }
        } else {
          // No reasoning detected, keep as-is
          processedParts.push(part);
        }
      } else {
        // Non-text parts (tool calls, reasoning parts from backend, etc.)
        processedParts.push(part);
      }
    }

    return processedParts;
  }, [message.parts, modelId, message.role]);

  if (message.role == "system") {
    return null; // system message is not shown
  }
  if (!partsForDisplay.length) return null;

  return (
    <div className="w-full mx-auto max-w-3xl px-6 group/message">
      <div
        className={cn(
          "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
          className,
        )}
      >
        <div className="flex flex-col gap-4 w-full">
          {partsForDisplay.map((part, index) => {
            const key = `message-${messageIndex}-part-${part.type}-${index}`;
            const isLastPart = index === partsForDisplay.length - 1;

            if (part.type === "reasoning") {
              return (
                <ReasoningPart
                  key={key}
                  readonly={readonly}
                  reasoningText={part.text}
                  isThinking={isLastPart && isLastMessage && isLoading}
                />
              );
            }

            if (isUserMessage && part.type === "text" && part.text) {
              return (
                <UserMessagePart
                  key={key}
                  status={status}
                  part={part}
                  readonly={readonly}
                  isLast={isLastPart}
                  message={message}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                />
              );
            }

            if (part.type === "text" && !isUserMessage) {
              return (
                <AssistMessagePart
                  threadId={threadId}
                  isLast={isLastMessage && isLastPart}
                  isLoading={isLoading}
                  key={key}
                  readonly={readonly}
                  part={part}
                  prevMessage={prevMessage}
                  showActions={
                    isLastMessage ? isLastPart && !isLoading : isLastPart
                  }
                  message={message}
                  setMessages={setMessages}
                  sendMessage={sendMessage}
                />
              );
            }

            if (isToolUIPart(part)) {
              const isLast = isLastMessage && isLastPart;
              const isManualToolInvocation =
                (message.metadata as ChatMetadata)?.toolChoice == "manual" &&
                isLastMessage &&
                isLastPart &&
                part.state == "input-available" &&
                isLoading &&
                !readonly;
              return (
                <ToolMessagePart
                  isLast={isLast}
                  readonly={readonly}
                  messageId={message.id}
                  isManualToolInvocation={isManualToolInvocation}
                  showActions={
                    !readonly &&
                    (isLastMessage ? isLastPart && !isLoading : isLastPart)
                  }
                  addToolResult={addToolResult}
                  key={key}
                  part={part}
                  setMessages={setMessages}
                />
              );
            } else if (part.type === "step-start") {
              return null;
            } else if (part.type === "file") {
              return (
                <FileMessagePart
                  key={key}
                  part={part}
                  isUserMessage={isUserMessage}
                />
              );
            } else if ((part as any).type === "source-url") {
              return (
                <SourceUrlMessagePart
                  key={key}
                  part={part as any}
                  isUserMessage={isUserMessage}
                />
              );
            } else {
              return <div key={key}> unknown part {part.type}</div>;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  function equalMessage(prevProps: Props, nextProps: Props) {
    if (prevProps.message.id !== nextProps.message.id) return false;

    if (prevProps.isLoading !== nextProps.isLoading) return false;

    if (prevProps.isLastMessage !== nextProps.isLastMessage) return false;

    if (prevProps.className !== nextProps.className) return false;

    if (nextProps.isLoading && nextProps.isLastMessage) return false;

    if (!equal(prevProps.message.metadata, nextProps.message.metadata))
      return false;

    if (prevProps.message.parts.length !== nextProps.message.parts.length) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }

    return true;
  },
);

const FRIENDLY_ERROR_MESSAGES = [
  "Oh no! This model is slightly busy. Try another one! 😉",
  "Oops! The AI is taking a coffee break. Please try again or switch models. ☕",
  "System overload! Give it a sec or pick a different model. 🤖",
  "Looks like this model is having a nap. Wake it up or try another! 🌙",
  "This model is a bit shy right now. Maybe try its sibling? 🙈",
  "Traffic jam in the neural network! 🚦 Try switching models.",
];

export const ErrorMessage = ({
  error: _error,
}: {
  error: Error;
  message?: UIMessage;
}) => {
  const t = useTranslations();

  // Pick a random message on mount
  const friendlyMessage = useMemo(() => {
    return FRIENDLY_ERROR_MESSAGES[
      Math.floor(Math.random() * FRIENDLY_ERROR_MESSAGES.length)
    ];
  }, []);

  return (
    <div className="w-full mx-auto max-w-3xl px-6 animate-in fade-in mt-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-4 px-2 opacity-90">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-destructive/10 rounded-sm">
              <TriangleAlertIcon className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm mb-1 text-destructive">
                {t("Chat.Error")}
              </p>
              <div className="text-sm text-muted-foreground">
                <p>{friendlyMessage}</p>
                {/* 
                  Hidden actual error for debugging if needed:
                  <p className="hidden">{error.message}</p> 
                */}
                <p className="text-xs text-muted-foreground mt-2 italic opacity-70">
                  {t("Chat.thisMessageWasNotSavedPleaseTryTheChatAgain")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
