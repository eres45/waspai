"use client";

import { memo, useMemo, useState } from "react";
import { ToolUIPart } from "ai";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "ui/button";

const CATEGORY_EMOJI: Record<string, string> = {
  productivity: "⚡",
  coding: "💻",
  media: "🎨",
  writing: "✍️",
  research: "🔍",
  automation: "🤖",
  other: "✨",
};

interface LoadedSkillCardProps {
  part: ToolUIPart;
}

export const LoadedSkillCard = memo(function LoadedSkillCard({
  part,
}: LoadedSkillCardProps) {
  const [showRecipe, setShowRecipe] = useState(false);
  const anyPart = part as any;
  const toolName =
    anyPart.toolName ||
    anyPart.toolInvocation?.toolName ||
    (typeof anyPart.type === "string" && anyPart.type.startsWith("tool-")
      ? anyPart.type.slice(5)
      : "");
  const isExecuting =
    part.state === "input-available" || part.state === "input-streaming";

  const input = anyPart.input || anyPart.args || anyPart.toolInvocation?.args;
  const output =
    anyPart.output || anyPart.result || anyPart.toolInvocation?.result;

  const isSearch = toolName === "search_skills" || toolName?.includes("search");

  // Format data for search_skills
  const searchResults = useMemo(() => {
    if (!isSearch || !output?.skills || !Array.isArray(output.skills))
      return [];
    return output.skills;
  }, [isSearch, output]);

  // Format data for load_skill
  const skill = useMemo(() => {
    if (isSearch) return null;
    return {
      name: output?.name || input?.name || "skill",
      title: output?.title || input?.name || "Skill",
      description: output?.description || "",
      category: output?.category || "productivity",
      toolsRequired: output?.toolsRequired || [],
      recipe: output?.recipe || "",
      instruction: output?.instruction || "",
      success: output?.success ?? !isExecuting,
    };
  }, [isSearch, output, input, isExecuting]);

  if (isExecuting) {
    return (
      <div className="flex items-center gap-2.5 py-2.5 px-3.5 my-2 text-xs bg-muted/40 border border-dashed rounded-xl max-w-xl animate-pulse">
        <Sparkles className="size-3.5 text-blue-500 animate-spin" />
        <span className="font-medium text-foreground">
          {isSearch
            ? `Searching skill vault for "${input?.query || "skills"}"...`
            : `Loading skill "${input?.name || "recipe"}" into working memory...`}
        </span>
      </div>
    );
  }

  // Render search_skills results
  if (isSearch) {
    return (
      <div className="flex flex-col gap-2.5 my-2.5 p-3.5 bg-card/60 backdrop-blur-sm border rounded-xl shadow-xs max-w-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Search className="size-3.5 text-blue-500" />
            <span>Skill Vault Search</span>
            {input?.query && (
              <span className="text-muted-foreground text-[11px] font-normal truncate max-w-[200px]">
                {`· "${input.query}"`}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40">
            {searchResults.length} skill{searchResults.length === 1 ? "" : "s"}{" "}
            found
          </span>
        </div>

        {searchResults.length > 0 ? (
          <div className="flex flex-col gap-1.5 mt-1">
            {searchResults.map((s: any, idx: number) => {
              const emoji = CATEGORY_EMOJI[s.category] || "✨";
              return (
                <div
                  key={s.name || idx}
                  className="flex items-start justify-between p-2 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{emoji}</span>
                      <span className="text-xs font-medium text-foreground truncate">
                        {s.title || s.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.2 rounded">
                        /{s.name}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {s.description}
                      </p>
                    )}
                  </div>
                  {s.toolsRequired && s.toolsRequired.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <Cpu className="size-3 text-muted-foreground/60" />
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {s.toolsRequired.slice(0, 2).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {`No exact skills matched "${input?.query}". General autonomous capabilities active.`}
          </p>
        )}
      </div>
    );
  }

  // Render load_skill card
  if (!skill) return null;

  const emoji = CATEGORY_EMOJI[skill.category] || "✨";

  return (
    <div className="flex flex-col gap-2.5 my-2.5 p-3.5 bg-card/60 backdrop-blur-sm border rounded-xl shadow-xs max-w-xl transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs">
            {emoji}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                {skill.title}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/40">
                /{skill.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="size-3" />
          <span>Active in Memory</span>
        </div>
      </div>

      {skill.description && (
        <p className="text-xs text-muted-foreground leading-relaxed pl-8">
          {skill.description}
        </p>
      )}

      {/* Tools and Recipe Row */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 pl-8">
        <div className="flex items-center gap-2 flex-wrap">
          {skill.toolsRequired && skill.toolsRequired.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded border border-border/30">
              <Cpu className="size-2.5 text-blue-500" />
              <span>{skill.toolsRequired.join(", ")}</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground capitalize font-medium">
            Category: {skill.category}
          </span>
        </div>

        {skill.recipe && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRecipe((prev) => !prev)}
            className="h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-3" />
            <span>{showRecipe ? "Hide" : "View"} recipe</span>
            {showRecipe ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </Button>
        )}
      </div>

      {/* Collapsible Recipe Drawer */}
      <AnimatePresence>
        {showRecipe && skill.recipe && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-1 pl-8"
          >
            <div className="p-3 bg-muted/30 border border-border/40 rounded-lg text-[11px] font-mono text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text custom-scrollbar">
              {skill.recipe}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
