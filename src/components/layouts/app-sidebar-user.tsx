"use client";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "ui/dropdown-menu";
import { AvatarFallback, AvatarImage, Avatar } from "ui/avatar";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
  useSidebar,
} from "ui/sidebar";
import {
  ChevronsUpDown,
  LogOutIcon,
  Palette,
  Languages,
  Sun,
  MoonStar,
  ChevronRight,
  Settings,
  CreditCard,
  Gift,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import Link from "next/link";
import { appStore } from "@/app/store";
import { BASE_THEMES, COOKIE_KEY_LOCALE, SUPPORTED_LOCALES } from "lib/const";
import { capitalizeFirstLetter, cn, fetcher } from "lib/utils";
import { authClient } from "auth/client";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/app/api/auth/actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import useSWR from "swr";
import { getLocaleAction } from "@/i18n/get-locale";
import { Suspense, useCallback, useState } from "react";
import { DiscordIcon } from "ui/discord-icon";
import { useThemeStyle } from "@/hooks/use-theme-style";
import { BasicUser } from "app-types/user";
import { getUserAvatar } from "lib/user/utils";
import { Skeleton } from "ui/skeleton";

export function AppSidebarUserInner(props: {
  user?: BasicUser;
}) {
  const { data: user, mutate } = useSWR<BasicUser>(
    `/api/user/details`,
    fetcher,
    {
      fallbackData: props.user,
      suspense: true,
      revalidateOnMount: true,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
      refreshInterval: 1000 * 60 * 5,
    },
  );
  const appStoreMutate = appStore((state) => state.mutate);
  const t = useTranslations("Layout");
  const { open: sidebarOpen } = useSidebar();
  const [copied, setCopied] = useState(false);

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

  if (!user) return null;

  const isPaidSubscriber =
    (user.tier === "pro" || user.tier === "ultra") &&
    !(user as any).tierExpiresAt;
  const showReferralWidget =
    !(user as any).referralWidgetHidden && !isPaidSubscriber && sidebarOpen;

  const referralCount = (user as any).referralCount || 0;

  let targetText = "";
  if (referralCount < 3) {
    targetText = "3 friends → 14 days Pro";
  } else if (referralCount < 5) {
    targetText = "5 friends → 1 month Pro";
  } else {
    targetText = "All rewards unlocked!";
  }

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        toast.success("Invite link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Failed to copy link. Please copy it manually.");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast.error("Failed to copy link.");
    }
  };

  const handleCopy = async () => {
    let code = (user as any)?.referralCode;
    if (!code) {
      const toastId = toast.loading("Generating your invite link...");
      try {
        const response = await fetch("/api/user/details");
        if (!response.ok) throw new Error("Failed to load user details");
        const data = await response.json();

        mutate(data, false);
        code = data.referralCode;
        if (!code) {
          throw new Error("No referral code returned");
        }
        toast.dismiss(toastId);
      } catch (error) {
        console.error("Error generating referral code live:", error);
        toast.dismiss(toastId);
        toast.error("Could not load referral code. Please try again.");
        return;
      }
    }
    const inviteLink = `${window.location.origin}/sign-up?ref=${code}`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(inviteLink)
        .then(() => {
          setCopied(true);
          toast.success("Invite link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Clipboard copy failed, using fallback:", err);
          fallbackCopy(inviteLink);
        });
    } else {
      fallbackCopy(inviteLink);
    }
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <AnimatePresence>
        {showReferralWidget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover="hover"
            className="bg-[#0d0d0f]/60 border border-white/10 rounded-xl p-3.5 space-y-3 shadow-xl backdrop-blur-md relative overflow-hidden group"
          >
            {/* Background Glow Effect */}
            <div className="absolute -right-10 -top-10 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/15 transition-all duration-300 pointer-events-none" />

            <div className="flex items-center space-x-3">
              <motion.div
                variants={{
                  hover: {
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: 1.05,
                    transition: { duration: 0.5 },
                  },
                }}
                className="p-2 bg-violet-500/15 border border-violet-500/25 text-violet-400 rounded-lg group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-colors"
              >
                <Gift className="w-4 h-4" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-white tracking-wide">
                  Get Pro Free
                </h4>
                <p className="text-[10px] text-white/50 truncate">
                  Invite friends to WaspAI
                </p>
              </div>
              <div className="flex items-center space-x-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-1 hover:bg-white/10 text-white/40 hover:text-white/80 rounded-md transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-[#0d0d0f] border border-white/10 p-3 max-w-xs text-xs text-white/90 space-y-1.5 shadow-2xl rounded-xl"
                  >
                    <p className="font-semibold text-white">
                      Referral Program Rules
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/70">
                      <li>3 successful signups → 14 days Pro</li>
                      <li>5 successful signups → 1 month Pro (stacks!)</li>
                      <li>
                        One-time offer. Widget disappears after 5 referrals.
                      </li>
                      <li>Self-referrals & same-domain emails are blocked.</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
                <span className="text-[10px] font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/70">
                  {referralCount}/5
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(Math.min(referralCount, 5) / 5) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/40">{targetText}</span>
                {referralCount >= 3 && (
                  <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Tier 1 active
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 active:bg-white/5 text-xs text-white font-medium rounded-lg transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white/60 group-hover:text-white/80 transition-colors" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
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
                    {user?.name?.slice(0, 1) || ""}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate" data-testid="sidebar-user-email">
                  {user?.email}
                </span>
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
  const { data: currentLocale } = useSWR(COOKIE_KEY_LOCALE, getLocaleAction, {
    fallbackData: SUPPORTED_LOCALES[0].code,
    revalidateOnFocus: false,
  });
  const handleOnChange = useCallback((locale: string) => {
    document.cookie = `${COOKIE_KEY_LOCALE}=${locale}; path=/;`;
    window.location.reload();
  }, []);

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
          {SUPPORTED_LOCALES.map((locale) => (
            <DropdownMenuCheckboxItem
              key={locale.code}
              checked={locale.code === currentLocale}
              onCheckedChange={() =>
                locale.code !== currentLocale && handleOnChange(locale.code)
              }
            >
              {locale.name}
            </DropdownMenuCheckboxItem>
          ))}
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
  return (
    <Suspense fallback={<AppSidebarUserSkeleton />}>
      <AppSidebarUserInner user={user} />
    </Suspense>
  );
}
