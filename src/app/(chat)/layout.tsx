import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { cookies } from "next/headers";
import { SidebarProvider } from "ui/sidebar";

import { AppPopupProvider } from "@/components/layouts/app-popup-provider";
import { ReferralInitializer } from "@/components/referral/referral-initializer";
import { getSession } from "lib/auth/server";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";
import { SWRConfigProvider } from "./swr-config";

import { redirect } from "next/navigation";

export default async function ChatLayout({
  children,
}: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  // Ensure session.user has avatar and latest name from DB if missing in cookie
  let userForClient = session.user;
  if (!userForClient.image) {
    try {
      const { userRepository } = await import("@/lib/db/repository");
      const dbUser = await userRepository.getUserById(session.user.id);
      if (dbUser?.image) {
        userForClient = {
          ...userForClient,
          image: dbUser.image,
          name: dbUser.name || userForClient.name,
        };
        cookieStore.set("auth-user", JSON.stringify(userForClient), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    } catch {
      // Non-blocking fallback
    }
  }

  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <SWRConfigProvider user={userForClient}>
        <ReferralInitializer />
        <AppPopupProvider />
        <AppSidebar user={userForClient} />
        <main className="relative bg-background flex-1 min-w-0 flex flex-col h-dvh overflow-hidden">
          <AppHeader />
          <div className="flex-1 overflow-y-auto relative">{children}</div>
        </main>
      </SWRConfigProvider>
    </SidebarProvider>
  );
}
