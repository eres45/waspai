"use client";

import { useRouter } from "next/navigation";
import { Zap, Crown, X } from "lucide-react";
import type { SkillSummary, SkillTier } from "@/types/skill";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "ui/drawer";

interface TierGateProps {
  skill: SkillSummary;
  requiredTier: SkillTier;
  open: boolean;
  onClose: () => void;
}

const TIER_INFO: Record<
  SkillTier,
  { label: string; price: string; icon: React.ReactNode; color: string }
> = {
  free: { label: "Free", price: "$0", icon: null, color: "" },
  pro: {
    label: "Pro",
    price: "$8/mo",
    icon: <Zap className="size-5 text-amber-400" />,
    color: "text-amber-400",
  },
  max: {
    label: "Max",
    price: "$15/mo",
    icon: <Crown className="size-5 text-rose-400" />,
    color: "text-rose-400",
  },
};

function TierGateContent({
  skill,
  requiredTier,
  onClose,
}: Omit<TierGateProps, "open">) {
  const router = useRouter();
  const info = TIER_INFO[requiredTier];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-xl bg-accent/50 text-2xl border border-border/40">
          {skill.icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{skill.title}</h3>
          <p className="text-sm text-muted-foreground">
            {skill.description.slice(0, 60)}…
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-accent/20 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {info.icon}
          <span className={`font-bold text-lg ${info.color}`}>
            {info.label} Plan Required
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{skill.title}</strong> requires a{" "}
          <strong className={info.color}>{info.label}</strong> subscription to
          install.
        </p>
        <p className="text-xs text-muted-foreground">
          Upgrade to {info.label} for{" "}
          <strong className="text-foreground">{info.price}</strong> to access
          this skill and hundreds of other premium features.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button
          className="w-full"
          onClick={() => {
            router.push("/pricing");
            onClose();
          }}
        >
          Upgrade to {info.label} — {info.price}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Maybe later
        </Button>
      </div>
    </div>
  );
}

export function SkillTierGate({
  skill,
  requiredTier,
  open,
  onClose,
}: TierGateProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="sr-only">Upgrade Required</DrawerTitle>
          </DrawerHeader>
          <TierGateContent
            skill={skill}
            requiredTier={requiredTier}
            onClose={onClose}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="size-4" />
          </Dialog.Close>
          <TierGateContent
            skill={skill}
            requiredTier={requiredTier}
            onClose={onClose}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
