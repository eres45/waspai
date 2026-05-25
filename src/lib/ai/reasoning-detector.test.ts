import { describe, expect, it } from "vitest";
import { stripReasoning } from "./reasoning-detector";

describe("stripReasoning", () => {
  const modelId = "openai/gpt-oss-120b";

  it("should handle fully closed think tags", () => {
    const input = "<think>I am thinking about gojo</think>Heyo, gojo!";
    const result = stripReasoning(input, modelId);
    expect(result.hasReasoning).toBe(true);
    expect(result.reasoning).toBe("I am thinking about gojo");
    expect(result.cleanText).toBe("Heyo, gojo!");
  });

  it("should handle unclosed streaming think tags at the start", () => {
    const input = "<think>I am thinking about gojo";
    const result = stripReasoning(input, modelId);
    expect(result.hasReasoning).toBe(true);
    expect(result.reasoning).toBe("I am thinking about gojo");
    expect(result.cleanText).toBe("");
  });

  it("should handle unclosed streaming think tags after text", () => {
    const input = "Here is some initial output. <think>Now thinking deeper";
    const result = stripReasoning(input, modelId);
    expect(result.hasReasoning).toBe(true);
    expect(result.reasoning).toBe("Now thinking deeper");
    expect(result.cleanText).toBe("Here is some initial output.");
  });

  it("should handle multiple think blocks with the last one being unclosed", () => {
    const input =
      "<think>first thought</think>Some intermediate text<think>second thought";
    const result = stripReasoning(input, modelId);
    expect(result.hasReasoning).toBe(true);
    expect(result.reasoning).toBe("first thought\n\nsecond thought");
    expect(result.cleanText).toBe("Some intermediate text");
  });

  it("should do nothing for non-leaky models without explicit tags", () => {
    const input = "hello world";
    const result = stripReasoning(input, "some-other-model");
    expect(result.hasReasoning).toBe(false);
    expect(result.reasoning).toBe("");
    expect(result.cleanText).toBe(input);
  });

  it("should still strip reasoning for non-leaky models if explicit tags are present", () => {
    const input = "<think>some text</think>hello";
    const result = stripReasoning(input, "some-other-model");
    expect(result.hasReasoning).toBe(true);
    expect(result.reasoning).toBe("some text");
    expect(result.cleanText).toBe("hello");
  });
});
