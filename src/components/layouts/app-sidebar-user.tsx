"use client";

import { signOutAction } from "@/app/api/auth/actions";
import { appStore } from "@/app/store";
import { useThemeStyle } from "@/hooks/use-theme-style";
import { getLocaleAction } from "@/i18n/get-locale";
import { BasicUser } from "app-types/user";
import { authClient } from "auth/client";
import { BASE_THEMES, COOKIE_KEY_LOCALE, SUPPORTED_LOCALES } from "lib/const";
import { getUserAvatar } from "lib/user/utils";
import { capitalizeFirstLetter, cn, fetcher } from "lib/utils";
import {
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Languages,
  LogOutIcon,
  MoonStar,
  Palette,
  Settings,
  Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { DiscordIcon } from "ui/discord-icon";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "ui/sidebar";
import { Skeleton } from "ui/skeleton";

export function AppSidebarUserInner(props: {
  user?: BasicUser;
}) {
  const { data: user } = useSWR<BasicUser>(`/api/user/details`, fetcher, {
    fallbackData: props.user,
    revalidateOnMount: !props.user?.image,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    refreshInterval: 1000 * 60 * 5,
  });
  const appStoreMutate = appStore((state) => state.mutate);
  const t = useTranslations("Layout");

  const logout = async () => {
    try {
      await signOutAction();
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      window.location.href = "/sign-in";
    }
  };

  if (!user) return <AppSidebarUserSkeleton />;

  return (
    <div className="flex flex-col space-y-2 w-full">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                type="button"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-input/30 border"
                size={"lg"}
                data-testid="sidebar-user-button"
              >
                <Avatar className="rounded-full size-8 border">
                  <AvatarImage
                    className="object-cover"
                    src={getUserAvatar(user)}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback>
                    {user?.name?.slice(0, 1) ||
                      user?.email?.slice(0, 1)?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-medium text-sm text-sidebar-foreground">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </span>
                  <span
                    className="truncate text-xs text-muted-foreground"
                    data-testid="sidebar-user-email"
                  >
                    {user?.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              className="bg-background w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
              align="center"
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full border">
                    <AvatarImage
                      className="object-cover"
                      src={getUserAvatar(user)}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.name?.slice(0, 1) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="font-semibold truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/subscription" className="cursor-pointer">
                  <CreditCard className="size-4 text-foreground" />
                  <span>Subscription</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SelectTheme />
              <SelectLanguage />
              <DropdownMenuItem asChild>
                <a
                  href="https://discord.gg/9tWpxD9W"
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer"
                >
                  <DiscordIcon className="size-4 fill-foreground text-foreground" />
                  <span>Discord</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setTimeout(() => {
                    appStoreMutate({ openUserSettings: true });
                  }, 150);
                }}
                className="cursor-pointer"
                data-testid="user-settings-menu-item"
              >
                <Settings className="size-4 text-foreground" />
                <span>User Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOutIcon className="size-4 text-foreground" />
                <span>{t("signOut")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}

function SelectTheme() {
  const t = useTranslations("Layout");

  const { theme = "light", setTheme } = useTheme();

  const { themeStyle = "default", setThemeStyle } = useThemeStyle();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="flex items-center"
        icon={
          <>
            <span className="text-muted-foreground text-xs min-w-0 truncate">
              {`${capitalizeFirstLetter(theme)} ${capitalizeFirstLetter(
                themeStyle,
              )}`}
            </span>
            <ChevronRight className="size-4 ml-2" />
          </>
        }
      >
        <Palette className="mr-2 size-4" />
        <span className="mr-auto">{t("theme")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-48">
          <DropdownMenuLabel className="text-muted-foreground w-full flex items-center">
            <span className="text-muted-foreground text-xs mr-2 select-none">
              {capitalizeFirstLetter(theme)}
            </span>
            <div className="flex-1" />

            <div
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="cursor-pointer border rounded-full flex items-center"
            >
              <div
                className={cn(
                  theme === "dark" &&
                    "bg-accent ring ring-muted-foreground/40 text-foreground",
                  "p-1 rounded-full",
                )}
              >
                <MoonStar className="size-3" />
              </div>
              <div
                className={cn(
                  theme === "light" &&
                    "bg-accent ring ring-muted-foreground/40 text-foreground",
                  "p-1 rounded-full",
                )}
              >
                <Sun className="size-3" />
              </div>
            </div>
          </DropdownMenuLabel>
          <div className="max-h-96 overflow-y-auto">
            {BASE_THEMES.map((t) => (
              <DropdownMenuCheckboxItem
                key={t}
                checked={themeStyle === t}
                onClick={(e) => {
                  e.preventDefault();
                  setThemeStyle(t);
                }}
                className="text-sm"
              >
                {capitalizeFirstLetter(t)}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function SelectLanguage() {
  const t = useTranslations("Layout");
  const router = useRouter();
  const { data: currentLocale, mutate } = useSWR(
    COOKIE_KEY_LOCALE,
    getLocaleAction,
    {
      fallbackData: SUPPORTED_LOCALES[0].code,
      revalidateOnFocus: false,
    },
  );
  const handleOnChange = useCallback(
    (locale: string) => {
      document.cookie = `${COOKIE_KEY_LOCALE}=${locale}; path=/;`;
      mutate(locale, false);
      router.refresh();
    },
    [mutate, router],
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="mr-2 size-4" />
        <span>{t("language")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-48 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="text-muted-foreground">
            {t("language")}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currentLocale}
            onValueChange={(val) => {
              if (val && val !== currentLocale) {
                handleOnChange(val);
              }
            }}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <DropdownMenuRadioItem key={locale.code} value={locale.code}>
                {locale.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

export function AppSidebarUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-input/30 border"
          size={"lg"}
          data-testid="sidebar-user-button"
        >
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebarUser({
  user,
}: {
  user?: BasicUser;
}) {
  return <AppSidebarUserInner user={user} />;
}
