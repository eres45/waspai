"use client";

import { useState, useEffect } from "react";
import { DeployedSite, DeployedSiteFile } from "@/types/site";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  FileCode2,
  FileText,
  Plus,
  Trash2,
  Save,
  Globe,
  RefreshCw,
  Code,
  Eye,
  Loader2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveSiteFileAction,
  createSiteFileAction,
  deleteSiteFileAction,
} from "@/app/api/sites/actions";

interface ProjectCodeBrowserProps {
  site: DeployedSite;
  initialFiles: DeployedSiteFile[];
}

export function ProjectCodeBrowser({
  site,
  initialFiles,
}: ProjectCodeBrowserProps) {
  const [files, setFiles] = useState<DeployedSiteFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(
    initialFiles.find((f) => f.path === "index.html")?.id ||
      initialFiles[0]?.id ||
      "",
  );
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [isEditing, setIsEditing] = useState(false);
  const [highlightMode, setHighlightMode] = useState(true);
  const [newFilePath, setNewFilePath] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const activeFile = files.find((f) => f.id === activeFileId);
  const [editorContent, setEditorContent] = useState("");

  // Keep editor content in sync with active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorContent(activeFile.content);
      setIsEditing(false);
    } else {
      setEditorContent("");
    }
  }, [activeFileId, activeFile]);

  // Construct subdomain preview URL
  const getPreviewUrl = () => {
    if (typeof window === "undefined") return "";
    const isDev = window.location.hostname === "localhost";
    const baseDomain = isDev ? "localhost:3000" : "waspai.in";
    const protocol = isDev ? "http" : "https";
    return `${protocol}://${site.slug}.${baseDomain}`;
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
    setIsEditing(true);
  };

  // Support Tab indentation in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        editorContent.substring(0, start) + "  " + editorContent.substring(end);
      setEditorContent(newContent);
      setIsEditing(true);

      // Reset cursor position after render
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      const res = await saveSiteFileAction(
        site.id,
        activeFile.path,
        editorContent,
      );
      if (res.success) {
        // Update local files state
        setFiles((prev) =>
          prev.map((f) =>
            f.id === activeFile.id
              ? { ...f, content: editorContent, updatedAt: new Date() }
              : f,
          ),
        );
        setIsEditing(false);
        setPreviewKey((prev) => prev + 1); // Refresh preview
        toast.success(`Successfully saved ${activeFile.path}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save file");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    setIsCreating(true);
    try {
      const res = await createSiteFileAction(
        site.id,
        newFilePath,
        "<!-- New file content -->",
      );
      if (res.success && res.cleanPath) {
        // Refresh local files state
        // Since we don't have the new generated record ID from the server action directly,
        // we can generate a temporary UUID or refetch the list.
        // Let's create a temporary file object.
        const tempId = Math.random().toString();
        const newFile: DeployedSiteFile = {
          id: tempId,
          siteId: site.id,
          path: res.cleanPath,
          content: "<!-- New file content -->",
          mimeType: "text/html",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Note: In a production app we'd fetch the real ID, but this lets us update the UI immediately.
        // Let's add it to the state.
        setFiles((prev) =>
          [...prev, newFile].sort((a, b) => a.path.localeCompare(b.path)),
        );
        setActiveFileId(tempId);
        setNewFilePath("");
        setShowAddForm(false);
        setPreviewKey((prev) => prev + 1);
        toast.success(`Created file ${res.cleanPath}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create file");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFile = async (id: string, path: string) => {
    if (path === "index.html") {
      toast.error("Cannot delete index.html");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${path}?`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      const res = await deleteSiteFileAction(site.id, path);
      if (res.success) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        if (activeFileId === id) {
          const indexId =
            files.find((f) => f.path === "index.html")?.id ||
            files[0]?.id ||
            "";
          setActiveFileId(indexId);
        }
        setPreviewKey((prev) => prev + 1);
        toast.success(`Deleted file ${path}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete file");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Get icons based on extensions
  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "html":
      case "htm":
        return <FileCode2 className="h-4 w-4 text-orange-500" />;
      case "css":
        return <FileCode2 className="h-4 w-4 text-blue-500" />;
      case "js":
      case "mjs":
        return <FileCode2 className="h-4 w-4 text-yellow-500" />;
      case "json":
        return <FileCode2 className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <Card className="bg-zinc-950/40 backdrop-blur border-zinc-800/60 overflow-hidden shadow-2xl rounded-2xl w-full h-[650px] flex flex-col">
      {/* Code Browser Header */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/60 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Globe className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-100 flex items-center gap-2 text-sm sm:text-base">
              <span>{site.title}</span>
              <span className="text-xs font-normal text-zinc-500 font-mono">
                ({site.slug})
              </span>
            </h2>
            <a
              href={getPreviewUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5 transition-colors"
            >
              <span>{getPreviewUrl()}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Action Toggle (Code vs Preview) */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 border border-zinc-800/80 p-0.5 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("code")}
              className={`h-7 px-3 text-xs gap-1.5 transition-all ${
                viewMode === "code"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Editor</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("preview")}
              className={`h-7 px-3 text-xs gap-1.5 transition-all ${
                viewMode === "preview"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Live Preview</span>
            </Button>
          </div>

          {viewMode === "preview" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar: File Navigator */}
        <div className="w-60 border-r border-zinc-800/60 flex flex-col bg-zinc-950/20">
          <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Files
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-md"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Add File Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateFile}
              className="p-3 border-b border-zinc-800/60 bg-zinc-900/40 flex flex-col gap-2"
            >
              <Input
                placeholder="e.g. css/style.css"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                className="h-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
                disabled={isCreating}
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-6 text-[10px] text-zinc-400"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white"
                  disabled={isCreating || !newFilePath.trim()}
                >
                  {isCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {files.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    setActiveFileId(file.id);
                    if (viewMode === "preview") setViewMode("code");
                  }}
                  className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 font-medium"
                      : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                  }`}
                >
                  {getFileIcon(file.path)}
                  <span className="text-xs truncate flex-1 font-mono">
                    {file.path}
                  </span>
                  {file.path !== "index.html" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id, file.path);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-all ml-auto"
                      disabled={isDeletingId === file.id}
                    >
                      {isDeletingId === file.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Workspace: Editor or Preview */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/10">
          {viewMode === "code" ? (
            activeFile ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Editor Control Bar */}
                <div className="border-b border-zinc-800/60 bg-zinc-950/40 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{activeFile.path}</span>
                    {isEditing && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse ml-1" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Highlight Mode */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHighlightMode(!highlightMode)}
                      className={`h-7 px-2 text-[10px] uppercase font-semibold gap-1 ${
                        highlightMode
                          ? "bg-zinc-800 text-indigo-400 hover:bg-zinc-800"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Syntax view
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !isEditing}
                      className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-zinc-200 disabled:text-zinc-500 flex items-center gap-1.5 font-medium"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>Save</span>
                    </Button>
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-hidden min-h-0 relative">
                  {highlightMode && !isEditing ? (
                    <div className="absolute inset-0 overflow-auto p-4 bg-zinc-950 text-zinc-200 font-mono text-sm leading-relaxed">
                      <CodeBlock
                        code={editorContent}
                        lang={activeFile.path.split(".").pop() || "html"}
                        fallback={
                          <pre className="whitespace-pre">{editorContent}</pre>
                        }
                        showLineNumbers={true}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={editorContent}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      className="absolute inset-0 w-full h-full bg-zinc-950 font-mono text-sm leading-relaxed text-zinc-200 p-4 resize-none border-0 focus:ring-0 focus:outline-none overflow-auto"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8">
                <FileCode2 className="h-12 w-12 text-zinc-700 mb-3" />
                <p className="text-sm">
                  Select a file from the sidebar to view code
                </p>
              </div>
            )
          ) : (
            /* Live Preview frame */
            <div className="flex-1 w-full h-full bg-white relative">
              <iframe
                key={previewKey}
                src={getPreviewUrl()}
                className="w-full h-full border-0 bg-white"
                title="Website Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
