"use client";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerTitle,
} from "ui/drawer";
import { Button } from "ui/button";
import { X, Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { fetcher } from "lib/utils";
import { BasicUserWithLastLogin } from "app-types/user";
import { UserDetail } from "./user-detail";
import { Suspense } from "react";

function UserSettingsPopupContent() {
  const openUserSettings = appStore((state) => state.openUserSettings);

  // Fetch current user details
  const {
    data: user,
    isLoading,
    error,
  } = useSWR<BasicUserWithLastLogin>(
    openUserSettings ? `/api/user/details` : null,
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Failed to load user settings. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <UserDetail user={user} currentUserId={user.id} view="user" />
    </div>
  );
}

export function UserSettingsPopup() {
  const t = useTranslations("Chat.ChatPreferences");
  const [openUserSettings, appStoreMutate] = appStore(
    useShallow((state) => [state.openUserSettings, state.mutate]),
  );

  const handleClose = () => {
    appStoreMutate({ openUserSettings: false });
  };

  return (
    <Drawer
      handleOnly
      open={openUserSettings}
      direction="top"
      onOpenChange={(open) => appStoreMutate({ openUserSettings: open })}
    >
      <DrawerPortal>
        <DrawerContent
          style={{
            userSelect: "text",
          }}
          className="max-h-[100vh]! w-full h-full rounded-none flex flex-col overflow-hidden p-4 md:p-6"
        >
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              {t("userSettings")}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="close-user-settings-button"
            >
              <X />
            </Button>
          </div>
          <DrawerDescription className="sr-only" />
          <div className="flex-1 flex flex-col min-h-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-96">
                  <Loader className="size-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <UserSettingsPopupContent />
            </Suspense>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
