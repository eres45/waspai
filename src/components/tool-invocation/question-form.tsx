"use client";

import { useState, useMemo } from "react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import {
  HelpCircle,
  Check,
  Copy,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "lib/utils";

export interface QuestionOption {
  label: string;
  description?: string;
  value?: string;
}

export interface QuestionItem {
  id?: string;
  question?: string;
  text?: string;
  header?: string;
  options?: Array<QuestionOption | string>;
  type?: "choice" | "multiple" | "open" | string;
  multiSelect?: boolean;
  example?: string;
  note?: string;
}

export interface QuestionFormProps {
  questions: QuestionItem[];
  instructions?: string;
}

export function QuestionFormCard({
  questions = [],
  instructions,
}: QuestionFormProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string[]>
  >({});
  const [copied, setCopied] = useState(false);

  const normalizedQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.map((q, idx) => {
      const qText = q.question || q.text || `Question ${idx + 1}`;
      const qId = q.id || `q_${idx}`;
      const isMulti = Boolean(
        q.multiSelect ||
          q.type === "multiple" ||
          q.note?.toLowerCase().includes("multiple"),
      );
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options: QuestionOption[] = rawOptions.map((opt) => {
        if (typeof opt === "string") {
          return { label: opt };
        }
        return {
          label: opt.label || (opt as any).text || String(opt),
          description: opt.description,
          value: opt.value,
        };
      });
      return {
        id: qId,
        text: qText,
        header: q.header,
        options,
        isMulti,
        type:
          q.type ||
          (options.length === 0 ? "open" : isMulti ? "multiple" : "choice"),
        example: q.example,
        note: q.note,
      };
    });
  }, [questions]);

  const handleSelectOption = (
    qId: string,
    optionLabel: string,
    isMulti: boolean,
  ) => {
    setSelectedAnswers((prev) => {
      const current = prev[qId] || [];
      if (isMulti) {
        const next = current.includes(optionLabel)
          ? current.filter((l) => l !== optionLabel)
          : [...current, optionLabel];
        return { ...prev, [qId]: next };
      } else {
        return { ...prev, [qId]: [optionLabel] };
      }
    });
  };

  const handleTextAnswerChange = (qId: string, text: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: text.trim() ? [text] : [],
    }));
  };

  const formattedResponseText = useMemo(() => {
    const lines: string[] = [];
    normalizedQuestions.forEach((q, idx) => {
      const answers = selectedAnswers[q.id];
      if (answers && answers.length > 0) {
        lines.push(`${idx + 1}. ${q.text}\n   Answer: ${answers.join(", ")}`);
      }
    });
    return lines.join("\n\n");
  }, [normalizedQuestions, selectedAnswers]);

  const answeredCount = useMemo(() => {
    return Object.values(selectedAnswers).filter((ans) => ans && ans.length > 0)
      .length;
  }, [selectedAnswers]);

  const handleCopyAnswers = async () => {
    if (!formattedResponseText) {
      toast.info("Please pick or type answers to the questions first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(formattedResponseText);
      setCopied(true);
      toast.success("Answers copied! Paste into chat to proceed.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy answers.");
    }
  };

  const handleInsertToChat = async () => {
    if (!formattedResponseText) {
      toast.info("Please pick or type answers to the questions first.");
      return;
    }
    try {
      // 1. Dispatch custom event for ChatMentionInput to automatically populate
      window.dispatchEvent(
        new CustomEvent("set-chat-input", {
          detail: { text: formattedResponseText },
        }),
      );
      // 2. Also copy to clipboard as reliable fallback
      await navigator.clipboard.writeText(formattedResponseText);
      toast.success("Answers inserted into chat! Press Send to continue.");
    } catch {
      toast.error("Failed to insert answers.");
    }
  };

  if (!normalizedQuestions.length) return null;

  return (
    <div className="w-full my-3 border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden border-border/80">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/40 border-b">
        <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <HelpCircle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold tracking-wide uppercase text-foreground">
              Clarification Questionnaire
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {answeredCount}/{normalizedQuestions.length} answered
            </span>
          </div>
          {instructions && (
            <p className="text-[11px] text-muted-foreground truncate">
              {instructions}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 h-7 px-2.5"
            onClick={handleCopyAnswers}
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-3.5 text-green-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="text-xs gap-1.5 h-7 px-2.5"
            onClick={handleInsertToChat}
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Insert into Chat</span>
            <span className="sm:hidden">Fill</span>
          </Button>
        </div>
      </div>

      {/* Questions list */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {normalizedQuestions.map((q, idx) => {
          const selected = selectedAnswers[q.id] || [];
          const isOpen = q.type === "open" || q.options.length === 0;

          return (
            <div
              key={q.id}
              className="space-y-2 pb-3.5 border-b last:border-b-0 border-border/50"
            >
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">
                      {q.text}
                    </p>
                    {q.header && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase font-mono">
                        {q.header}
                      </span>
                    )}
                  </div>
                  {q.note && (
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                      {q.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Options or Input */}
              {isOpen ? (
                <div className="pl-7 pt-1">
                  <Input
                    placeholder={
                      q.example || "Type your answer or requirement here..."
                    }
                    value={selected[0] || ""}
                    onChange={(e) =>
                      handleTextAnswerChange(q.id, e.target.value)
                    }
                    className="h-8 text-xs bg-background/80"
                  />
                  {q.example && !selected[0] && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">
                      e.g., {q.example}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 pl-7">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selected.includes(opt.label);
                    const isRecommended =
                      opt.label.includes("(Recommended)") ||
                      (oIdx === 0 &&
                        !opt.label.toLowerCase().includes("other"));

                    return (
                      <button
                        key={`${q.id}_${oIdx}`}
                        type="button"
                        onClick={() =>
                          handleSelectOption(q.id, opt.label, q.isMulti)
                        }
                        className={cn(
                          "flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer relative",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground font-medium"
                            : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span
                            className={cn(
                              "size-3.5 rounded-full border flex items-center justify-center shrink-0 text-[9px] transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {isSelected && (
                              <Check className="size-2.5 stroke-[3]" />
                            )}
                          </span>
                          <span className="truncate text-xs flex-1 text-foreground">
                            {opt.label}
                          </span>
                          {isRecommended && !isSelected && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-medium shrink-0 flex items-center gap-0.5">
                              <Sparkles className="size-2.5" /> Best
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[10px] text-muted-foreground mt-1 pl-5.5 leading-snug">
                            {opt.description}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-muted/20 border-t flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="text-[11px]">
          Select options or type values above, then click Insert into Chat
        </span>
        <Button
          size="sm"
          className="text-xs gap-1.5 h-7 shrink-0"
          onClick={handleInsertToChat}
        >
          <span>Insert into Chat</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
