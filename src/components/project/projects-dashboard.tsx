"use client";

import { useState } from "react";
import useSWR from "swr";
import { useArchives } from "@/hooks/queries/use-archives";
import { fetcher } from "lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "ui/scroll-area";
import { toast } from "sonner";
import {
  Loader2,
  Globe,
  Eye,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  Search,
  Folder,
  MessageSquare,
  Plus,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "ui/input";
import { ArchiveDialog } from "@/components/archive-dialog";
import LightRays from "ui/light-rays";
import Particles from "ui/particles";

interface DeployedSite {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  viewCount: number;
  createdAt: string;
}

export function ProjectsDashboard() {
  const [activeTab, setActiveTab] = useState<"sites" | "folders">("sites");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolderForEdit, setSelectedFolderForEdit] = useState<any>(null);

  // Fetch Deployed Sites
  const {
    data: sites,
    isLoading: loadingSites,
    mutate: mutateSites,
  } = useSWR<DeployedSite[]>("/api/sites", fetcher, { fallbackData: [] });

  // Fetch Project Folders (previously archives)
  const {
    data: archives,
    isLoading: loadingArchives,
    mutate: mutateArchives,
  } = useArchives();

  const handleCopyLink = (slug: string) => {
    const isDev = window.location.hostname === "localhost";
    const baseDomain = isDev ? "localhost:3000" : "waspai.in";
    const url = `https://${slug}.${baseDomain}`;

    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!", {
      description: url,
    });
  };

  const handleDeleteSite = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the site "${title}"? This will take it down immediately.`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch("/api/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete site");

      toast.success(`Successfully deleted "${title}"`);
      mutateSites();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete the site. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getSubdomainUrl = (slug: string) => {
    if (typeof window === "undefined") return "";
    const isDev = window.location.hostname === "localhost";
    const baseDomain = isDev ? "localhost:3000" : "waspai.in";
    return `https://${slug}.${baseDomain}`;
  };

  // Filter lists based on search
  const filteredSites = (sites || []).filter(
    (site) =>
      site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredFolders = (archives || []).filter(
    (folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (folder.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* Background Visuals */}
      <>
        <div className="absolute opacity-30 pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <LightRays className="bg-transparent" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <Particles
            className="bg-transparent"
            particleCount={250}
            particleBaseSize={8}
          />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-20 bg-gradient-to-t from-background to-50% to-transparent" />
      </>

      <ScrollArea className="h-full w-full z-30 relative">
        <div className="pt-8 flex-1 relative flex flex-col gap-6 px-8 max-w-4xl h-full mx-auto pb-12">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text">
                My Projects
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your deployed subdomains and chat history folders in one
                unified workspace.
              </p>
            </div>

            {activeTab === "folders" && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedFolderForEdit(null);
                  setFolderDialogOpen(true);
                }}
                className="font-semibold gap-1.5 self-start sm:self-auto"
              >
                <Plus className="size-4" /> Create Folder
              </Button>
            )}
          </div>

          {/* Search bar & Tabs */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Tabs */}
            <div className="flex bg-muted/40 p-1 rounded-lg border border-border/40 max-w-fit backdrop-blur-sm">
              <button
                onClick={() => {
                  setActiveTab("sites");
                  setSearchQuery("");
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeTab === "sites"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="size-4" /> Deployed Sites (
                  {sites?.length || 0})
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("folders");
                  setSearchQuery("");
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeTab === "folders"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Folder className="size-4" /> Chat Folders (
                  {archives?.length || 0})
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder={
                  activeTab === "sites"
                    ? "Search sites..."
                    : "Search folders..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-muted"
              />
            </div>
          </div>

          {/* Dynamic Content */}
          {activeTab === "sites" ? (
            loadingSites ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Loading your live sites...
                </p>
              </div>
            ) : filteredSites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSites.map((site) => {
                  const liveUrl = getSubdomainUrl(site.slug);
                  return (
                    <Card
                      key={site.id}
                      className="bg-card/30 border-muted/70 backdrop-blur-sm hover:border-muted-foreground/30 transition-all duration-300 flex flex-col h-full"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <CardTitle
                              className="text-lg font-semibold truncate"
                              title={site.title}
                            >
                              {site.title}
                            </CardTitle>
                            <CardDescription
                              className="flex items-center gap-1 text-xs truncate"
                              title={liveUrl}
                            >
                              <Globe className="size-3 flex-shrink-0 text-muted-foreground" />
                              <span className="truncate text-muted-foreground/90">
                                {site.slug}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyLink(site.slug)}
                              title="Copy Link"
                            >
                              <Copy className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                handleDeleteSite(site.id, site.title)
                              }
                              disabled={deletingId === site.id}
                              title="Delete Site"
                            >
                              {deletingId === site.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 flex-1">
                        <p className="text-sm text-muted-foreground/80 line-clamp-2">
                          {site.description || "No description provided."}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0 border-t border-border/10 mt-auto flex items-center justify-between text-xs text-muted-foreground px-6 py-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="size-3.5" /> {site.viewCount} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />{" "}
                            {new Date(site.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link
                          href={liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          Visit <ExternalLink className="size-3" />
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">
                  No sites match &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-muted rounded-xl bg-card/10 p-8 backdrop-blur-sm">
                <Globe className="size-12 text-muted-foreground/50 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold mb-1">No Deployed Sites</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                  Ask WaspAI in the chat to generate a landing page, website or
                  web app, and it will deploy it live for you!
                </p>
                <Link href="/chat">
                  <Button size="sm" className="font-semibold">
                    Start Chatting
                  </Button>
                </Link>
              </div>
            )
          ) : /* Project Folders Tab */
          loadingArchives ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                Loading your folders...
              </p>
            </div>
          ) : filteredFolders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className="bg-card/30 border-muted/70 backdrop-blur-sm hover:border-muted-foreground/30 transition-all duration-300 flex flex-col h-full"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <Link
                          href={`/projects/${folder.id}`}
                          className="hover:underline"
                        >
                          <CardTitle className="text-lg font-semibold truncate flex items-center gap-2">
                            <Folder className="size-4.5 text-yellow-500 fill-yellow-500/10 flex-shrink-0" />
                            {folder.name}
                          </CardTitle>
                        </Link>
                        <CardDescription className="text-xs">
                          Created{" "}
                          {new Date(folder.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => {
                          setSelectedFolderForEdit(folder);
                          setFolderDialogOpen(true);
                        }}
                      >
                        <Settings2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 flex-1">
                    <p className="text-sm text-muted-foreground/80 line-clamp-2">
                      {folder.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-border/10 mt-auto flex items-center justify-between text-xs text-muted-foreground px-6 py-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3.5" />{" "}
                      {folder.itemCount || 0} chats archived
                    </span>
                    <Link
                      href={`/projects/${folder.id}`}
                      className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                    >
                      Open Folder &rarr;
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground">
                No folders match &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-muted rounded-xl bg-card/10 p-8 backdrop-blur-sm">
              <Folder className="size-12 text-muted-foreground/50 mb-4 animate-pulse" />
              <h3 className="text-xl font-bold mb-1">No Project Folders</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Create a project folder to group and organize your chatbot
                conversations.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedFolderForEdit(null);
                  setFolderDialogOpen(true);
                }}
                className="font-semibold"
              >
                Create Your First Folder
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* dialog for creating / editing folders */}
      <ArchiveDialog
        archive={selectedFolderForEdit}
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSuccess={() => {
          mutateArchives();
        }}
      />
    </>
  );
}
