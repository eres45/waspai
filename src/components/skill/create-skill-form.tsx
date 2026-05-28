"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Eye, Edit3, Loader2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "lib/utils";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import type { SkillCategory, SkillTier } from "@/types/skill";
import { Switch } from "ui/switch";

const CATEGORIES: { value: SkillCategory; label: string; emoji: string }[] = [
  { value: "productivity", label: "Productivity", emoji: "⚡" },
  { value: "coding", label: "Coding", emoji: "💻" },
  { value: "media", label: "Media", emoji: "🎨" },
  { value: "writing", label: "Writing", emoji: "✍️" },
  { value: "research", label: "Research", emoji: "🔍" },
  { value: "automation", label: "Automation", emoji: "🤖" },
  { value: "other", label: "Other", emoji: "📦" },
];

const TIERS: { value: SkillTier; label: string; desc: string }[] = [
  { value: "free", label: "Free", desc: "Available to all users" },
  { value: "pro", label: "Pro", desc: "Requires Pro ($8/mo)" },
  { value: "max", label: "Max", desc: "Requires Max ($15/mo)" },
];

const TOOLS = [
  { value: "image-gen", label: "Image Generation" },
  { value: "web-search", label: "Web Search" },
  { value: "video-gen", label: "Video Generation" },
  { value: "edit-image", label: "Image Editing" },
  { value: "pdf-gen", label: "PDF Generation" },
  { value: "code-exec", label: "Code Execution" },
];

const ICON_EMOJIS = [
  "🔧",
  "💡",
  "🚀",
  "🎯",
  "⚡",
  "🤖",
  "✍️",
  "📊",
  "🎨",
  "🔍",
  "📝",
  "🎬",
  "📧",
  "💻",
  "🌐",
  "📱",
];

const DEFAULT_CONTENT = `# Skill Name

## Purpose
Describe what this skill teaches the AI to do.

## Instructions
1. Step-by-step guidance for the AI
2. Specific behaviors to follow
3. Output format requirements

## Examples
- Example 1: ...
- Example 2: ...

## Notes
Any important caveats or limitations.
`;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

export function CreateSkillForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [form, setForm] = useState({
    title: "",
    name: "",
    description: "",
    category: "productivity" as SkillCategory,
    tags: "",
    icon: "🔧",
    tierRequired: "free" as SkillTier,
    toolsRequired: [] as string[],
    isPublic: true,
    content: DEFAULT_CONTENT,
    version: "1.0.0",
  });

  const set = (key: keyof typeof form, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (val: string) => {
    set("title", val);
    if (!slugTouched) {
      set("name", slugify(val));
    }
  };

  const toggleTool = (tool: string) => {
    set(
      "toolsRequired",
      form.toolsRequired.includes(tool)
        ? form.toolsRequired.filter((t) => t !== tool)
        : [...form.toolsRequired, tool],
    );
  };

  const handleGenerateWithAI = useCallback(async () => {
    if (!form.title || !form.description) {
      toast.error("Please fill in a title and description first");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          message: {
            id: crypto.randomUUID(),
            role: "user",
            parts: [
              {
                type: "text",
                text: `Generate a detailed SKILL.md markdown file for an AI skill called "${form.title}". Description: "${form.description}". Category: ${form.category}. 

The SKILL.md should instruct an AI assistant exactly how to behave when this skill is active. Include:
- Purpose section
- Step-by-step instructions for the AI
- Output format requirements  
- Examples
- Edge cases to handle

Keep it practical and actionable. Return ONLY the markdown content, no preamble.`,
              },
            ],
          },
          messages: [],
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE-style stream
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                content += JSON.parse(line.slice(2));
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      }

      if (content) {
        set("content", content);
        toast.success("✨ SKILL.md generated!");
      } else {
        toast.error("Generation returned no content");
      }
    } catch (_e) {
      toast.error("Failed to generate with AI");
    } finally {
      setIsGenerating(false);
    }
  }, [form.title, form.description, form.category]);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Skill content is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create skill");
      }

      const skill = await res.json();
      toast.success("🎉 Skill created successfully!");
      router.push(`/skills/${skill.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create skill");
    } finally {
      setIsSubmitting(false);
    }
  }, [form, router]);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-5 bg-gradient-to-b from-accent/20 to-background">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => router.push("/skills")}
            >
              <ArrowLeft className="size-4" />
              Library
            </Button>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-foreground">Create Skill</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !form.title || !form.description}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Generate with AI
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Publish Skill
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: metadata */}
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-4">
              <h2 className="font-semibold text-sm text-foreground uppercase tracking-wider">
                Basic Info
              </h2>

              {/* Icon picker */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Icon
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => set("icon", emoji)}
                      className={cn(
                        "size-9 rounded-lg text-lg flex items-center justify-center border transition-all",
                        form.icon === emoji
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-border hover:bg-accent/50",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label
                  htmlFor="skill-title"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Title *
                </Label>
                <Input
                  id="skill-title"
                  placeholder="e.g. PDF Creator"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              {/* Slug */}
              <div>
                <Label
                  htmlFor="skill-slug"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Slug (unique ID) *
                </Label>
                <Input
                  id="skill-slug"
                  placeholder="e.g. pdf-creator"
                  value={form.name}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("name", slugify(e.target.value));
                  }}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="skill-desc"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Description *
                </Label>
                <textarea
                  id="skill-desc"
                  rows={3}
                  className="w-full rounded-lg bg-accent/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="What does this skill do? Keep it concise (10-500 chars)."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-0.5 text-right">
                  {form.description.length}/500
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-semibold text-sm text-foreground uppercase tracking-wider">
                Classification
              </h2>

              {/* Category */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Category *
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => set("category", cat.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        form.category === cat.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/50 text-muted-foreground hover:border-border hover:bg-accent/50",
                      )}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label
                  htmlFor="skill-tags"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Tags (comma-separated)
                </Label>
                <Input
                  id="skill-tags"
                  placeholder="e.g. pdf, document, export"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                />
              </div>

              {/* Tier */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Required Tier
                </Label>
                <div className="flex flex-col gap-1.5">
                  {TIERS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => set("tierRequired", t.value)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all text-left",
                        form.tierRequired === t.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/50 text-muted-foreground hover:border-border",
                      )}
                    >
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools Required */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Required Tools
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool.value}
                      onClick={() => toggleTool(tool.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
                        form.toolsRequired.includes(tool.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/50 text-muted-foreground hover:border-border hover:bg-accent/50",
                      )}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Is Public */}
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-accent/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Public Skill
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visible to all users in the library
                  </p>
                </div>
                <Switch
                  checked={form.isPublic}
                  onCheckedChange={(v) => set("isPublic", v)}
                />
              </div>
            </section>
          </div>

          {/* Right column: content editor */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-foreground uppercase tracking-wider">
                SKILL.md Content *
              </h2>
              <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    !previewMode
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Edit3 className="size-3" />
                  Edit
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    previewMode
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Eye className="size-3" />
                  Preview
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/20 border border-border/40 rounded-lg px-3 py-2">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              <span>
                This content gets injected into the AI&apos;s system prompt when
                the skill is active. Write clear, imperative instructions.
              </span>
            </div>

            {previewMode ? (
              <div className="flex-1 rounded-xl border border-border/60 bg-accent/5 p-5 min-h-[500px] overflow-auto">
                <div className="prose prose-sm prose-invert max-w-none overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                className="flex-1 min-h-[500px] rounded-xl bg-accent/20 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                placeholder="Write your SKILL.md content here..."
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
