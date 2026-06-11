"use client";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Sparkles, Zap, ShieldCheck, ChevronRight } from "lucide-react";

export function UpgradePopup() {
  const [openUpgrade, upgradeReason, appStoreMutate] = appStore(
    useShallow((state) => [
      state.openUpgrade,
      state.upgradeReason,
      state.mutate,
    ]),
  );

  const handleUpgradePro = () => {
    appStoreMutate({ openUpgrade: false });
    window.location.href = "/checkout/pro";
  };

  const handleViewAllPlans = () => {
    appStoreMutate({ openUpgrade: false });
    window.location.href = "/subscription";
  };

  return (
    <Dialog
      open={openUpgrade}
      onOpenChange={(open) => appStoreMutate({ openUpgrade: open })}
    >
      <DialogContent className="max-w-[420px] bg-[#0b0f19] border-[#27272a] text-[#fafafa] p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center z-[100]">
        {/* Animated Premium Icon */}
        <div className="relative size-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mb-2">
          <Zap className="size-8 text-blue-500 fill-blue-500 animate-[pulse_2s_infinite]" />
          <Sparkles className="size-5 text-yellow-400 absolute -top-1.5 -right-1.5 animate-bounce" />
        </div>

        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-xs text-[#a1a1aa] max-w-sm">
            {upgradeReason ||
              "Access advanced reasoning models, image generation, and pro features."}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits list */}
        <div className="w-full my-5 space-y-3 text-left">
          {[
            "Full access to advanced Pro AIs (GPT-4o, Claude 3.5 Sonnet, etc.)",
            "Unlimited web search, tools, and custom HTTP workflows",
            "Pro image generation and document/file converters",
            "MCP servers integration & priority generation speeds",
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-[#d4d4d8]"
            >
              <ShieldCheck className="size-4.5 text-green-500 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Price & Savings Callout */}
        <div className="w-full bg-[#18181b]/50 border border-[#27272a] rounded-xl p-3.5 flex items-center justify-between text-left mb-5">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-wider">
              Pro Subscription
            </p>
            <p className="text-xl font-black text-white mt-0.5">
              ₹830
              <span className="text-xs font-normal text-[#a1a1aa]">/month</span>
            </p>
          </div>
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full shrink-0">
            60% cheaper than competition
          </span>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-2">
          <Button
            onClick={handleUpgradePro}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/10"
          >
            Upgrade to Pro
          </Button>
          <Button
            variant="ghost"
            onClick={handleViewAllPlans}
            className="w-full text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/40 py-2 transition-colors flex items-center justify-center gap-1"
          >
            Compare other plans (Ultra / Free){" "}
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
