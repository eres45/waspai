import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  OPENAI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
} from "./file-support";

vi.mock("server-only", () => ({}));

let modelsModule: typeof import("./models");

beforeAll(async () => {
  modelsModule = await import("./models");
});

describe("customModelProvider file support metadata", () => {
  it("includes default file support for OpenAI GPT-4o (P1)", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "OpenAI",
      model: "GPT-4o (P1)",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );

    const openaiProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "OpenAI",
    );
    const metadata = openaiProvider?.models.find(
      (item) => item.name === "GPT-4o (P1)",
    );

    expect(metadata?.supportedFileMimeTypes).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );
  });

  it("adds rich support for Anthropic Claude 3.5 Sonnet (P1)", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "Anthropic",
      model: "Claude 3.5 Sonnet (P1)",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(ANTHROPIC_FILE_MIME_TYPES),
    );
  });
});
