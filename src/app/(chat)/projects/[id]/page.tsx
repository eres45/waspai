import { archiveRepository, siteRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "ui/card";
import { MessageCircleXIcon, Code, MessageSquare } from "lucide-react";
import { ArchiveActionsClient } from "@/app/(chat)/projects/[id]/archive-actions-client";
import { Separator } from "ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { ProjectCodeBrowser } from "@/components/project/project-code-browser";

import LightRays from "ui/light-rays";
import Particles from "ui/particles";

// Simple date formatting function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

interface ArchiveWithThreads {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  threads: Array<{
    id: string;
    title: string;
    createdAt: Date;
    lastMessageAt: number;
  }>;
}

async function getArchiveWithThreads(
  archiveId: string,
): Promise<ArchiveWithThreads | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const [archive, archiveItems] = await Promise.all([
    archiveRepository.getArchiveById(archiveId),
    archiveRepository.getArchiveItems(archiveId),
  ]);

  if (!archive || archive.userId !== session.user.id) return null;

  const threadIds = archiveItems.map((item) => item.itemId);

  if (threadIds.length === 0) {
    return { ...archive, threads: [] };
  }

  // Fetch only the specific threads in this archive — avoids N+1 query
  const { supabaseRest } = await import("lib/db/supabase-rest");
  const { data: threadRows } = await supabaseRest
    .from("chat_thread")
    .select("id, title, created_at")
    .eq("user_id", session.user.id)
    .in("id", threadIds);

  const threads = (threadRows || [])
    .map((t: any) => ({
      id: t.id,
      title: t.title,
      createdAt: new Date(t.created_at),
      lastMessageAt: new Date(t.created_at).getTime(),
    }))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  return { ...archive, threads };
}

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const archive = await getArchiveWithThreads(id);

  if (!archive) {
    redirect("/chat");
  }

  // Fetch associated deployed site & files
  const site = await siteRepository.getSiteByProjectId(id);
  const files = site ? await siteRepository.getSiteFiles(site.id) : [];

  const renderThreadsList = () => (
    <div className="space-y-3">
      {archive.threads.length === 0 ? (
        <Card className="bg-transparent border-none">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <MessageCircleXIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No threads in this folder
              </h3>
              <p className="text-muted-foreground">
                Add some chat threads to this folder to see them here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        archive.threads.map((thread) => (
          <Link key={thread.id} href={`/chat/${thread.id}`}>
            <Card className="hover:bg-accent/30 transition-all duration-200 cursor-pointer">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-base truncate mb-1">
                      {thread.title || "Untitled Chat"}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(
                      new Date(thread.lastMessageAt || thread.createdAt),
                    )}
                  </span>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))
      )}
    </div>
  );

  return (
    <>
      <>
        <div className="absolute opacity-30 pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <LightRays className="bg-transparent" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <Particles
            className="bg-transparent"
            particleCount={400}
            particleBaseSize={10}
          />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <div className="w-full h-full bg-gradient-to-t from-background to-50% to-transparent z-20" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <div className="w-full h-full bg-gradient-to-l from-background to-20% to-transparent z-20" />
        </div>
        <div className="absolute pointer-events-none top-0 left-0 w-full h-full z-10 fade-in animate-in duration-5000">
          <div className="w-full h-full bg-gradient-to-r from-background to-20% to-transparent z-20" />
        </div>
      </>
      <div className="container mx-auto p-6 max-w-5xl z-40">
        {/* Archive Header */}
        <div className="mb-8 z-50">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{archive.name}</h1>
            <div className="flex-1" />
            <p className="text-xs text-muted-foreground mr-2">
              Created {formatTimeAgo(archive.createdAt)}
            </p>
            <div className="h-4">
              <Separator orientation="vertical" />
            </div>
            <ArchiveActionsClient
              archive={{
                id: archive.id,
                name: archive.name,
                description: archive.description,
                userId: session.user.id,
                createdAt: archive.createdAt,
                updatedAt: archive.updatedAt,
              }}
            />
          </div>
          {archive.description && (
            <p className="text-muted-foreground text-sm mt-4">
              {archive.description}
            </p>
          )}
        </div>

        {/* Content Area: If site exists, render Tabs for Code Browser & Threads */}
        <div className="relative z-40">
          {site ? (
            <Tabs defaultValue="code" className="w-full space-y-6">
              <div className="flex justify-start">
                <TabsList className="bg-zinc-900/60 border border-zinc-800/60 p-[3px] rounded-lg">
                  <TabsTrigger
                    value="code"
                    className="text-xs gap-1.5 transition-all"
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span>Editor & Preview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="threads"
                    className="text-xs gap-1.5 transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat Threads</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="code"
                className="outline-none focus:outline-none"
              >
                <ProjectCodeBrowser site={site} initialFiles={files} />
              </TabsContent>

              <TabsContent
                value="threads"
                className="outline-none focus:outline-none"
              >
                {renderThreadsList()}
              </TabsContent>
            </Tabs>
          ) : (
            renderThreadsList()
          )}
        </div>
      </div>
    </>
  );
}
