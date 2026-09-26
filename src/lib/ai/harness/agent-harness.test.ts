import { describe, it, expect, vi } from "vitest";
import {
  ActionCircuitBreaker,
  executeWithReflectiveEnvelope,
  createHarnessedToolkit,
  compactToolOutput,
  compactPriorTurnToolInvocations,
} from "./agent-harness";

describe("ActionCircuitBreaker (Hermes-inspired)", () => {
  it("allows unique tool calls with different arguments", () => {
    const breaker = new ActionCircuitBreaker(2);

    const call1 = breaker.checkAndRecord("web-search", { query: "BTC price" });
    const call2 = breaker.checkAndRecord("web-search", { query: "ETH price" });
    const call3 = breaker.checkAndRecord("python-execution", {
      code: "print(1)",
    });

    expect(call1.allowed).toBe(true);
    expect(call2.allowed).toBe(true);
    expect(call3.allowed).toBe(true);
  });

  it("normalizes argument key ordering to accurately catch identical calls", () => {
    const breaker = new ActionCircuitBreaker(2);

    const fp1 = breaker.getFingerprint("search", { b: 2, a: 1 });
    const fp2 = breaker.getFingerprint("search", { a: 1, b: 2 });

    expect(fp1).toBe(fp2);

    // Call 1
    const res1 = breaker.checkAndRecord("search", { b: 2, a: 1 });
    // Call 2
    const res2 = breaker.checkAndRecord("search", { a: 1, b: 2 });
    // Call 3 (should be blocked)
    const res3 = breaker.checkAndRecord("search", { a: 1, b: 2 });

    expect(res1.allowed).toBe(true);
    expect(res2.allowed).toBe(true);
    expect(res3.allowed).toBe(false);
    expect(res3.reason).toContain("CIRCUIT_BREAKER_TRIGGERED");
  });

  it("permits up to maxAllowedRepetitions before tripping", () => {
    const breaker = new ActionCircuitBreaker(3);
    const args = { query: "latest AI news" };

    expect(breaker.checkAndRecord("web-search", args).allowed).toBe(true);
    expect(breaker.checkAndRecord("web-search", args).allowed).toBe(true);
    expect(breaker.checkAndRecord("web-search", args).allowed).toBe(true);

    const blocked = breaker.checkAndRecord("web-search", args);
    expect(blocked.allowed).toBe(false);
    expect(blocked.executionCount).toBe(4);
  });

  it("resets state when reset() is called", () => {
    const breaker = new ActionCircuitBreaker(1);
    const args = { query: "test" };

    expect(breaker.checkAndRecord("test-tool", args).allowed).toBe(true);
    expect(breaker.checkAndRecord("test-tool", args).allowed).toBe(false);

    breaker.reset();

    expect(breaker.checkAndRecord("test-tool", args).allowed).toBe(true);
  });
});

describe("executeWithReflectiveEnvelope (DeepSeek-inspired)", () => {
  it("returns output when executor succeeds", async () => {
    const executor = vi.fn().mockResolvedValue({ data: "success" });
    const result = await executeWithReflectiveEnvelope(
      "my-tool",
      { x: 1 },
      {},
      executor,
    );

    expect(result).toEqual({ data: "success" });
    expect(executor).toHaveBeenCalledWith({ x: 1 }, {});
  });

  it("catches errors and wraps them in a reflective diagnostic envelope", async () => {
    const executor = vi
      .fn()
      .mockRejectedValue(new Error("Database connection timed out"));
    const result = (await executeWithReflectiveEnvelope(
      "db-query",
      { id: 123 },
      {},
      executor,
    )) as any;

    expect(result.status).toBe("error");
    expect(result.isReflectiveError).toBe(true);
    expect(result.tool).toBe("db-query");
    expect(result.error).toBe("Database connection timed out");
    expect(result.resolutionHint).toContain("Do not apologize to the user");
  });
});

describe("createHarnessedToolkit", () => {
  it("wraps tools and applies circuit breaker and error envelope", async () => {
    const mockTool = {
      description: "A test calculation tool",
      parameters: {},
      execute: vi
        .fn()
        .mockImplementation(async (args: { fail?: boolean; val: number }) => {
          if (args.fail) throw new Error("Calculation overflow");
          return { result: args.val * 2 };
        }),
    };

    const tools = { "calc-tool": mockTool };
    const harnessed = createHarnessedToolkit(tools, { maxRepetitions: 2 });

    // Preserves metadata
    expect(harnessed["calc-tool"].description).toBe("A test calculation tool");

    // Success call 1
    const res1 = await harnessed["calc-tool"].execute({ val: 5 }, {});
    expect(res1).toEqual({ result: 10 });

    // Success call 2 (same args, allowed)
    const res2 = await harnessed["calc-tool"].execute({ val: 5 }, {});
    expect(res2).toEqual({ result: 10 });

    // Call 3 (identical args, should trip circuit breaker)
    const res3 = await harnessed["calc-tool"].execute({ val: 5 }, {});
    expect(res3.status).toBe("blocked");
    expect(res3.isCircuitBreaker).toBe(true);
    expect(res3.message).toContain("CIRCUIT_BREAKER_TRIGGERED");

    // Error call with different args (should be caught by error envelope)
    const res4 = await harnessed["calc-tool"].execute(
      { fail: true, val: 99 },
      {},
    );
    expect(res4.status).toBe("error");
    expect(res4.isReflectiveError).toBe(true);
    expect(res4.error).toBe("Calculation overflow");
  });

  it("leaves client-only manual tools without execute untouched", () => {
    const clientTool = {
      description: "Client side only tool",
      parameters: {},
    };

    const tools = { "client-tool": clientTool };
    const harnessed = createHarnessedToolkit(tools);

    expect(harnessed["client-tool"]).toBe(clientTool);
  });
});

describe("Context Compaction (Hermes/DeepSeek-inspired)", () => {
  it("compactToolOutput truncates strings longer than maxLength", () => {
    const longString = "A".repeat(1000);
    const compacted = compactToolOutput(longString, 100);

    expect(compacted.length).toBeLessThan(longString.length);
    expect(compacted).toContain("[Tool output compacted:");
    expect(compacted).toContain("900 chars omitted");
  });

  it("compactToolOutput summarizes large arrays", () => {
    const largeArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
    }));
    const compacted = compactToolOutput(largeArray, 50);

    expect(compacted._summary).toContain("Array of 20 items");
    expect(compacted.sample.length).toBe(2);
  });

  it("compactPriorTurnToolInvocations preserves active turn while compacting prior turns", () => {
    const messages = [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Question 1" }],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [
          {
            type: "tool-invocation",
            toolInvocation: {
              toolName: "web-search",
              args: { q: "old query" },
              result: "Old very long search result ".repeat(50),
            },
          },
        ],
      },
      {
        id: "msg-3",
        role: "user",
        parts: [{ type: "text", text: "Question 2 (Active Turn)" }],
      },
      {
        id: "msg-4",
        role: "assistant",
        parts: [
          {
            type: "tool-invocation",
            toolInvocation: {
              toolName: "web-search",
              args: { q: "active query" },
              result: "Active fresh result ".repeat(50),
            },
          },
        ],
      },
    ];

    const result = compactPriorTurnToolInvocations(messages, {
      maxToolOutputLength: 100,
    });

    // Prior turn (msg-2) should be compacted
    const priorResult = (result[1].parts[0] as any).toolInvocation.result;
    expect(priorResult).toContain("[Tool output compacted:");

    // Active turn (msg-4) should NOT be compacted (100% full fresh data)
    const activeResult = (result[3].parts[0] as any).toolInvocation.result;
    expect(activeResult).not.toContain("[Tool output compacted:");
    expect(activeResult).toEqual("Active fresh result ".repeat(50));
  });
});
