"use client";
import { Sidebar, SidebarContent, SidebarFooter } from "ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarAgents } from "./app-sidebar-agents";
// [CHARACTER MODE - TEMPORARILY HIDDEN] import { AppSidebarCharacterMode } from "./app-sidebar-character-mode";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { SidebarHeaderShared } from "./sidebar-header";

import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { AppSidebarUser } from "./app-sidebar-user";
import { BasicUser } from "app-types/user";
import { generateUUID } from "lib/utils";

export function AppSidebar({
  user,
}: {
  user?: BasicUser;
}) {
  const userRole = user?.role;
  const router = useRouter();
  // Keep a stable ref to router to avoid re-adding the listener on every
  // render (Next.js `router` is not referentially stable between renders).
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  // Handle new chat shortcut (specific to main app)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.openNewChat)) {
        e.preventDefault();
        routerRef.current.push(`/chat/${generateUUID()}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          router.push(`/chat/${generateUUID()}`);
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
