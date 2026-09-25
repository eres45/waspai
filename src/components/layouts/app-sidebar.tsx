"use client";
import { Sidebar, SidebarContent, SidebarFooter } from "ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarAgents } from "./app-sidebar-agents";
// [CHARACTER MODE - TEMPORARILY HIDDEN] import { AppSidebarCharacterMode } from "./app-sidebar-character-mode";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { SidebarHeaderShared } from "./sidebar-header";

import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { AppSidebarUser } from "./app-sidebar-user";
import { BasicUser } from "app-types/user";

export function AppSidebar({
  user,
}: {
  user?: BasicUser;
}) {
  const userRole = user?.role;
  const router = useRouter();

  // Handle new chat shortcut (specific to main app)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.openNewChat)) {
        e.preventDefault();
        router.push("/chat");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-sidebar-border/80"
    >
      <SidebarHeaderShared
        title="Wasp AI"
        href="/chat"
        enableShortcuts={true}
        onLinkClick={() => {
          router.push("/chat");
        }}
      />

      <SidebarContent className="mt-2 overflow-hidden relative flex flex-col flex-1 min-h-0 gap-0">
        <div className="flex flex-col shrink-0">
          <AppSidebarMenus user={user} />
          <AppSidebarAgents userRole={userRole} />
          {/* [CHARACTER MODE - TEMPORARILY HIDDEN] <AppSidebarCharacterMode /> */}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <AppSidebarThreads />
        </div>
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <AppSidebarUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
