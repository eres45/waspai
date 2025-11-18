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
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const UserDetailContent = dynamic(
  () => import("./user-detail-content").then((mod) => mod.UserDetailContent),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-96 bg-muted rounded" />,
  },
);

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
          className="max-h-[100vh]! w-full h-full  rounded-none flex flex-col overflow-hidden p-4 md:p-6"
        >
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="close-user-settings-button"
            >
              <X />
            </Button>
          </div>
          <DrawerTitle className="sr-only">{t("userSettings")}</DrawerTitle>
          <DrawerDescription className="sr-only" />
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
              <Suspense
                fallback={
                  <div className="animate-pulse h-96 bg-muted rounded" />
                }
              >
                <UserDetailContent view="user" />
              </Suspense>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
