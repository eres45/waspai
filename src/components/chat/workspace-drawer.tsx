"use client";

import { useMemo, useState } from "react";
import { UIMessage } from "ai";
import {
  Folder,
  FileText,
  Download,
  Copy,
  Check,
  Eye,
  FileCode2,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCopy } from "@/hooks/use-copy";

export interface WorkspaceArtifactItem {
  id: string;
  name: string;
  path: string;
  content?: string;
  url?: string;
  type: "file" | "download" | "screenshot";
  extension: string;
  addedLines?: number;
  deletedLines?: number;
  size?: number;
  stepId?: string;
}

interface WorkspaceDrawerProps {
  messages: UIMessage[];
}

export function WorkspaceFilesDrawer({ messages }: WorkspaceDrawerProps) {
  const [openWorkspaceDrawer, appStoreMutate] = appStore(
    useShallow((state) => [state.openWorkspaceDrawer, state.mutate]),
  );

  const [activeTab, setActiveTab] = useState<
    "all" | "files" | "downloads" | "screenshots"
  >("all");
  const { copy } = useCopy();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { items, totalAdded, totalDeleted } = useMemo(() => {
    const list: WorkspaceArtifactItem[] = [];
    const seenPaths = new Set<string>();
    let added = 0;
    let deleted = 0;

    for (const msg of messages) {
      if (!msg.parts) continue;
      for (const part of msg.parts as any[]) {
        const toolName = part.toolName || part.toolInvocation?.toolName;
        const input = part.input || part.args || part.toolInvocation?.args;
        const output =
          part.output || part.result || part.toolInvocation?.result;
        const toolCallId = part.toolCallId || part.toolInvocation?.toolCallId;

        // 1. Files created/edited via write_site_file / edit_site_file
        if (toolName === "write_site_file" || toolName === "edit_site_file") {
          const path = output?.path || input?.path || "file";
          const content =
            output?.content ||
            input?.content ||
            input?.replacementContent ||
            "";
          const ext = path.split(".").pop() || "txt";
          const itemAdded = content ? content.split("\n").length : 1;
          const itemDeleted = input?.targetContent
            ? input.targetContent.split("\n").length
            : 0;

          if (!seenPaths.has(path)) {
            seenPaths.add(path);
            list.push({
              id: toolCallId || path,
              name: path.split("/").pop() || path,
              path,
              content,
              type: "file",
              extension: ext.toUpperCase(),
              addedLines: itemAdded,
              deletedLines: itemDeleted,
              stepId: toolCallId,
            });
            added += itemAdded;
            deleted += itemDeleted;
          }
        }

        // 2. Document & PDF generators
        if (
          toolName === "generate-pdf" ||
          toolName === "generate-word-document" ||
          toolName === "generate-csv" ||
          toolName === "generate-text-file"
        ) {
          const filename = output?.filename || input?.title || "document.pdf";
          const ext = filename.split(".").pop() || "pdf";
          list.push({
            id: toolCallId || filename,
            name: filename,
            path: filename,
            url: output?.downloadUrl,
            type: "download",
            extension: ext.toUpperCase(),
            size: output?.size,
            stepId: toolCallId,
          });
        }

        // 3. Screenshots from browser or image searches
        if (toolName === "steel-browser" || toolName === "screenshot") {
          const screenshotUrl =
            output?.screenshot || output?.image || output?.url;
          if (screenshotUrl && typeof screenshotUrl === "string") {
            list.push({
              id: toolCallId || `${list.length}`,
              name: "Screenshot",
              path: "screenshot.png",
              url: screenshotUrl,
              type: "screenshot",
              extension: "PNG",
              stepId: toolCallId,
            });
          }
        }
      }
    }

    return { items: list, totalAdded: added, totalDeleted: deleted };
  }, [messages]);

  const filteredItems = useMemo(() => {
    if (activeTab === "files") return items.filter((i) => i.type === "file");
    if (activeTab === "downloads")
      return items.filter((i) => i.type === "download");
    if (activeTab === "screenshots")
      return items.filter((i) => i.type === "screenshot");
    return items;
  }, [items, activeTab]);

  const handleDownload = (item: WorkspaceArtifactItem) => {
    if (item.url) {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.name;
      link.click();
      toast.success(`Downloading ${item.name}`);
      return;
    }

    if (item.content) {
      const blob = new Blob([item.content], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${item.name}`);
    }
  };

  const scrollToStep = (stepId?: string) => {
    if (stepId) {
      const el = document.querySelector(`[data-step-id="${stepId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        appStoreMutate({ openWorkspaceDrawer: false });
        return;
      }
    }
  };

  return (
    <Dialog
      open={openWorkspaceDrawer}
      onOpenChange={(open) => appStoreMutate({ openWorkspaceDrawer: open })}
    >
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-md border-border/80 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-card/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Folder className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Project Files & Artifacts
              </h3>
              <p className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} generated
                in this thread
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-500">
              <Zap className="size-3" />
              <span>Auto-synced</span>
            </div>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-muted/20 border-b border-border/40 text-xs">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">
              Total Files
            </span>
            <span className="font-semibold text-foreground text-sm font-mono">
              {items.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">
              Lines Added
            </span>
            <span className="font-semibold text-emerald-500 text-sm font-mono">
              +{totalAdded}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">
              Lines Deleted
            </span>
            <span className="font-semibold text-rose-500 text-sm font-mono">
              -{totalDeleted}
            </span>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-border/30 overflow-x-auto no-scrollbar">
          {(["all", "files", "downloads", "screenshots"] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize shrink-0 cursor-pointer",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
          {filteredItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
              <FileCode2 className="size-8 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs">
                No artifacts matching this category yet.
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                Generate code, PDFs, or screenshots in the chat to see them
                here.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/60 hover:bg-muted/30 transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {item.type === "screenshot" ? (
                      <ImageIcon className="size-4.5 text-muted-foreground" />
                    ) : item.type === "download" ? (
                      <Download className="size-4.5 text-primary" />
                    ) : (
                      <FileText className="size-4.5 text-foreground" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate font-mono">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="uppercase font-semibold tracking-wider text-[10px] text-muted-foreground/80">
                        {item.extension}
                      </span>
                      {item.addedLines !== undefined && item.addedLines > 0 && (
                        <span className="font-mono text-emerald-500 font-semibold">
                          +{item.addedLines}
                        </span>
                      )}
                      {item.deletedLines !== undefined &&
                        item.deletedLines > 0 && (
                          <span className="font-mono text-rose-500 font-semibold">
                            -{item.deletedLines}
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.stepId && (
                    <button
                      type="button"
                      onClick={() => scrollToStep(item.stepId)}
                      title="Jump to execution step"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                    >
                      <Eye className="size-3.5" />
                      <span className="hidden sm:inline">Jump</span>
                    </button>
                  )}

                  {item.content && (
                    <button
                      type="button"
                      onClick={() => {
                        copy(item.content || "");
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="Copy content"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    title="Download item"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
