import { describe, it, expect } from "vitest";
import { askUserQuestionTool } from "./ask-user";

describe("askUserQuestionTool (DeepSeek Harness tool-ask-user)", () => {
  it("structures questions with options, header, and multiSelect flags", async () => {
    const input = {
      questions: [
        {
          id: "storage_choice",
          header: "Storage Architecture",
          question: "Which storage backend should we configure?",
          options: [
            {
              label: "S3 Compatible (Recommended)",
              description: "High durability and multi-cloud compatibility.",
            },
            {
              label: "Local Filesystem",
              description:
                "Zero external dependencies, ideal for single nodes.",
            },
          ],
          multiSelect: false,
        },
      ],
    };

    const res = (await (askUserQuestionTool as any).execute(input, {})) as any;

    expect(res.status).toBe("pending_user_input");
    expect(res.isUserQuestion).toBe(true);
    expect(res.questions.length).toBe(1);
    expect(res.questions[0].id).toBe("storage_choice");
    expect(res.questions[0].options.length).toBe(2);
    expect(res.questions[0].options[0].label).toContain("(Recommended)");
  });
});
