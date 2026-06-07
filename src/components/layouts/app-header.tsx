"use client";

import { useSidebar } from "ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import {
  AudioWaveformIcon,
  ChevronDown,
  MessageCircleDashed,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "ui/button";
import { Separator } from "ui/separator";

import { useEffect, useMemo } from "react";
import { ThreadDropdown } from "../thread-dropdown";
import { appStore } from "@/app/store";
import { usePathname, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/shallow";
import { getShortcutKeyList, Shortcuts } from "lib/keyboard-shortcuts";
import { useTranslations } from "next-intl";
import { TextShimmer } from "ui/text-shimmer";
import { buildReturnUrl } from "lib/admin/navigation-utils";
import { BackButton } from "@/components/layouts/back-button";
import { authClient } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/api/auth/actions";

export function AppHeader() {
  const t = useTranslations();
  const [appStoreMutate] = appStore(useShallow((state) => [state.mutate]));
  const { toggleSidebar, open } = useSidebar();
  const currentPaths = usePathname();
  const searchParams = useSearchParams();

  const showActionButtons = useMemo(() => {
    if (currentPaths.startsWith("/admin")) {
      return false;
    }
    return true;
  }, [currentPaths]);

  const componentByPage = useMemo(() => {
    if (currentPaths.startsWith("/chat/")) {
      return <ThreadDropdownComponent />;
    }
    if (
      currentPaths.startsWith("/admin/users/") &&
      currentPaths.split("/").length > 3
    ) {
      const searchPageParams = searchParams.get("searchPageParams");
      const returnUrl = buildReturnUrl("/admin/users", searchPageParams || "");
      return (
        <BackButton
          data-testid="admin-users-back-button"
          returnUrl={returnUrl}
          title={t("Admin.Users.backToUsers")}
        />
      );
    }
  }, [currentPaths, searchParams]);

  const isChatPage = useMemo(() => {
    return currentPaths.startsWith("/chat") || currentPaths === "/";
  }, [currentPaths]);

  return (
    <header
      className={
        isChatPage
          ? "absolute top-0 left-0 right-0 z-50 flex items-center px-3 py-2 bg-transparent pointer-events-none"
          : "sticky top-0 z-50 flex items-center px-3 py-2 bg-background/95 backdrop-blur-md border-b border-border/40"
      }
    >
      <div className={isChatPage ? "pointer-events-auto" : ""}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle Sidebar"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar();
              }}
              data-testid="sidebar-toggle"
              data-state={open ? "open" : "closed"}
            >
              <PanelLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent align="start" side="bottom">
            <div className="flex items-center gap-2">
              {t("KeyboardShortcuts.toggleSidebar")}
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {getShortcutKeyList(Shortcuts.toggleSidebar).map((key) => (
                  <span
                    key={key}
                    className="w-5 h-5 flex items-center justify-center bg-muted rounded "
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className={isChatPage ? "pointer-events-auto" : ""}>
        {componentByPage}
      </div>
      <div className="flex-1" />
      {showActionButtons && (
        <div
          className={`flex items-center gap-2 ${
            isChatPage ? "pointer-events-auto" : ""
          }`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="bg-secondary/40"
                onClick={() => {
                  appStoreMutate((state) => ({
                    voiceChat: {
                      ...state.voiceChat,
                      isOpen: true,
                      agentId: undefined,
                    },
                  }));
                }}
              >
                <AudioWaveformIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end" side="bottom">
              <div className="text-xs flex items-center gap-2">
                {t("KeyboardShortcuts.toggleVoiceChat")}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {getShortcutKeyList(Shortcuts.toggleVoiceChat).map((key) => (
                    <span
                      className="w-5 h-5 flex items-center justify-center bg-muted rounded "
                      key={key}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={"icon"}
                variant={"secondary"}
                className="bg-secondary/40"
                onClick={() => {
                  appStoreMutate((state) => ({
                    temporaryChat: {
                      ...state.temporaryChat,
                      isOpen: !state.temporaryChat.isOpen,
                    },
                  }));
                }}
              >
                <MessageCircleDashed className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="end" side="bottom">
              <div className="text-xs flex items-center gap-2">
                {t("KeyboardShortcuts.toggleTemporaryChat")}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {getShortcutKeyList(Shortcuts.toggleTemporaryChat).map(
                    (key) => (
                      <span
                        className="w-5 h-5 flex items-center justify-center bg-muted rounded "
                        key={key}
                      >
                        {key}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <UserProfileDropdown />
        </div>
      )}

      {/* Center-Top Upgrade Plan Button */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-auto hidden sm:flex items-center gap-1.5 z-50">
        <Button
          asChild
          variant="ghost"
          className="h-8 px-4 rounded-full border border-border/80 hover:border-foreground/30 bg-secondary/30 hover:bg-secondary/60 text-foreground/80 hover:text-foreground transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-black/5 flex items-center gap-1.5 text-xs font-semibold group cursor-pointer"
        >
          <Link href="/subscription">
            <Sparkles className="size-3.5 text-foreground/60 group-hover:text-foreground group-hover:rotate-12 transition-all duration-300" />
            <span>Upgrade your Plan</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}

function UserProfileDropdown() {
  const { data: session } = authClient.useSession();

  if (!session?.user) return null;

  const handleSignOut = async () => {
    try {
      await signOutAction();
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Button
          variant="ghost"
          className="size-8 rounded-full p-0 border border-border/40 hover:border-border/80 transition-all overflow-hidden group"
        >
          <Avatar className="size-full">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback className="bg-muted text-[10px] text-muted-foreground uppercase">
              {session.user.name?.slice(0, 2) || "AI"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-popover/95 border-border backdrop-blur-xl rounded-xl p-2 shadow-2xl"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-bold truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThreadDropdownComponent() {
  const t = useTranslations();
  const [threadList, currentThreadId, generatingTitleThreadIds] = appStore(
    useShallow((state) => [
      state.threadList,
      state.currentThreadId,
      state.generatingTitleThreadIds,
    ]),
  );
  const currentThread = useMemo(() => {
    return (
      threadList.find((thread) => thread.id === currentThreadId) ||
      (currentThreadId ? { id: currentThreadId, title: "" } : null)
    );
  }, [threadList, currentThreadId]);

  useEffect(() => {
    if (currentThread?.id) {
      document.title = currentThread.title || t("Layout.newChat");
    }
  }, [currentThread?.id, currentThread?.title, t]);

  if (!currentThread) return null;

  return (
    <div className="items-center gap-1 hidden md:flex">
      <div className="w-1 h-4">
        <Separator orientation="vertical" />
      </div>

      <ThreadDropdown
        threadId={currentThread.id}
        beforeTitle={currentThread.title || t("Layout.newChat")}
      >
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-input! hover:text-foreground cursor-pointer flex gap-1 items-center px-2 py-1 rounded-md hover:bg-accent"
              >
                {generatingTitleThreadIds.includes(currentThread.id) ? (
                  <TextShimmer className="truncate max-w-60 min-w-0 mr-1">
                    {currentThread.title || t("Layout.newChat")}
                  </TextShimmer>
                ) : (
                  <p className="truncate max-w-60 min-w-0 mr-1">
                    {currentThread.title || t("Layout.newChat")}
                  </p>
                )}

                <ChevronDown size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-4 break-all overflow-y-auto max-h-[200px]">
              {currentThread.title || t("Layout.newChat")}
            </TooltipContent>
          </Tooltip>
        </div>
      </ThreadDropdown>
    </div>
  );
}
