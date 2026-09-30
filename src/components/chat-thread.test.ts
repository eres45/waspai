import { describe, it, expect } from "vitest";
import React from "react";
(globalThis as any).React = React;
import { renderToString } from "react-dom/server";
import { PreviewMessage } from "./message";
import { NextIntlClientProvider } from "next-intl";

describe("Render thread messages", () => {
  it("renders messages including todo_write and empty parts without TDZ errors", () => {
    const enMessages = {
      Common: { approve: "Approve", reject: "Reject" },
    };

    const testMessages = [
      {
        id: "msg-1",
        threadId: "test-thread",
        role: "user" as const,
        parts: [{ type: "text", text: "Hello" }],
        metadata: {},
        createdAt: new Date().toISOString(),
      },
      {
        id: "msg-2",
        threadId: "test-thread",
        role: "assistant" as const,
        parts: [
          {
            type: "tool-todo_write",
            toolCallId: "tc-123",
            state: "output-available",
            input: {
              todos: [
                { id: "1", content: "Task 1", status: "completed" },
                { id: "2", content: "Task 2", status: "in_progress" },
                { id: "3", content: "Task 3", status: "pending" },
              ],
            },
            output: { summary: "Updated" },
          },
        ],
        metadata: {},
        createdAt: new Date().toISOString(),
      },
      {
        id: "msg-3",
        threadId: "test-thread",
        role: "assistant" as const,
        parts: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      },
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const msg = testMessages[i];
      const html = renderToString(
        React.createElement(
          NextIntlClientProvider,
          { locale: "en", messages: enMessages } as any,
          React.createElement(PreviewMessage, {
            message: msg as any,
            messageIndex: i,
            prevMessage: testMessages[i - 1] as any,
            threadId: "test-thread",
            isLoading: false,
            isLastMessage: i === testMessages.length - 1,
            readonly: false,
          }),
        ),
      );
      expect(typeof html).toBe("string");
    }
  });
});
