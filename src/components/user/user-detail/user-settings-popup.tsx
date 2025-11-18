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
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function UserSettingsPopup() {
  const t = useTranslations("Chat.ChatPreferences");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);

  const [openUserSettings, appStoreMutate] = appStore(
    useShallow((state) => [state.openUserSettings, state.mutate]),
  );

  const handleClose = () => {
    appStoreMutate({ openUserSettings: false });
  };

  useEffect(() => {
    if (!openUserSettings) {
      setIsLoading(true);
      return;
    }

    const loadUserDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get session from authClient
        const { data: session } = await authClient.getSession();

        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        // Fetch user detail from API
        const response = await fetch(`/api/user/${session.user.id}`);
        if (!response.ok) {
          throw new Error("Failed to load user settings");
        }

        const data = await response.json();
        setUserDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error loading user settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDetail();
  }, [openUserSettings]);

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
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                  <Loader className="size-4 animate-spin" />
                  Loading user settings...
                </div>
              ) : error ? (
                <div className="p-6 text-center text-destructive">{error}</div>
              ) : userDetail ? (
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      User Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        <span>{userDetail.name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span>{userDetail.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID:</span>{" "}
                        <span className="text-xs font-mono">
                          {userDetail.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  No user data available
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
