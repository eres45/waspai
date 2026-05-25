"use client";

import { useEffect, useState } from "react";
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
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Input } from "ui/input";

interface DeployedSite {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  viewCount: number;
  createdAt: string;
}

export default function SitesManagePage() {
  const [sites, setSites] = useState<DeployedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error("Failed to fetch sites");
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load your deployed sites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCopyLink = (slug: string) => {
    const isDev = window.location.hostname === "localhost";
    const baseDomain = isDev ? "localhost:3000" : "waspai.in";
    const url = `https://${slug}.${baseDomain}`;

    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard!", {
      description: url,
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`,
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
      setSites((prev) => prev.filter((s) => s.id !== id));
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

  const filteredSites = sites.filter(
    (site) =>
      site.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ScrollArea className="h-full w-full">
      <div className="pt-8 flex-1 relative flex flex-col gap-6 px-8 max-w-4xl h-full mx-auto pb-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Link
                href="/skills"
                className="hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="size-3.5" /> Back to Skills
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text">
              My Deployed Sites
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage the landing pages, apps, and websites generated and hosted
              by your AI.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {sites.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search by title or subdomain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-muted"
            />
          </div>
        )}

        {/* Content Area */}
        {loading ? (
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
                  className="bg-card/40 border-muted/80 backdrop-blur-sm hover:border-muted-foreground/30 transition-all duration-300 flex flex-col h-full"
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
                          onClick={() => handleDelete(site.id, site.title)}
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
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
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
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-muted rounded-xl bg-card/10 p-8">
            <Globe className="size-12 text-muted-foreground/50 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold mb-1">No Deployed Sites Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Ask the AI in the chat to build you a website, app, or landing
              page. It will automatically build and host it for you!
            </p>
            <Link href="/chat">
              <Button size="sm" className="font-semibold">
                Start Chatting
              </Button>
            </Link>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
