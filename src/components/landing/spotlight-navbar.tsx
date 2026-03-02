"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
}

export interface SpotlightNavbarProps {
  items?: NavItem[];
  className?: string;
  onItemClick?: (item: NavItem, index: number) => void;
  defaultActiveIndex?: number;
  user?: any; // Added user prop
}

export function SpotlightNavbar({
  items = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Events", href: "#events" },
    { label: "Sponsors", href: "#sponsors" },
    { label: "Pricing", href: "#pricing" },
  ],
  className,
  onItemClick,
  defaultActiveIndex = 0,
  user,
}: SpotlightNavbarProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const spotlightX = useRef(0);
  const ambienceX = useRef(0);

  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverX(x);
      spotlightX.current = x;
      nav.style.setProperty("--spotlight-x", `${x}px`);
    };

    const handleMouseLeave = () => {
      setHoverX(null);
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
      if (activeItem) {
        const navRect = nav.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const targetX = itemRect.left - navRect.left + itemRect.width / 2;
        animate(spotlightX.current, targetX, {
          type: "spring",
          stiffness: 200,
          damping: 20,
          onUpdate: (v) => {
            spotlightX.current = v;
            nav.style.setProperty("--spotlight-x", `${v}px`);
          },
        });
      }
    };

    nav.addEventListener("mousemove", handleMouseMove);
    nav.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      nav.removeEventListener("mousemove", handleMouseMove);
      nav.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [activeIndex]);

  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`);
    if (activeItem) {
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;
      animate(ambienceX.current, targetX, {
        type: "spring",
        stiffness: 200,
        damping: 20,
        onUpdate: (v) => {
          ambienceX.current = v;
          nav.style.setProperty("--ambience-x", `${v}px`);
        },
      });
    }
  }, [activeIndex]);

  const handleItemClick = (item: NavItem, index: number) => {
    setActiveIndex(index);
    onItemClick?.(item, index);
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <div className={cn("relative flex justify-center pt-10", className)}>
      <nav
        ref={navRef}
        className={cn(
          "relative h-11 rounded-full transition-all duration-300",
          "bg-white/5 border border-white/[0.12] shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md",
        )}
      >
        {/* Items */}
        <ul className="relative flex items-center h-full px-2 gap-0 z-[10]">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const isAuthItem =
              item.label === "Sign In" || item.label === "Chat";

            if (user && isLast && isAuthItem) {
              return (
                <li
                  key={idx}
                  className="relative h-full flex items-center justify-center px-1"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/5 transition-colors duration-200 group">
                        <Avatar className="size-7 border border-white/10 group-hover:border-white/20 transition-colors">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="bg-white/5 text-[10px] text-white/60">
                            {user.name?.slice(0, 2).toUpperCase() || "AI"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                          {user.name?.split(" ")[0]}
                        </span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-52 bg-[#1c1c1f]/95 border-white/10 backdrop-blur-xl text-white rounded-2xl p-2 shadow-2xl"
                      align="end"
                      sideOffset={12}
                    >
                      <DropdownMenuLabel className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-white/40 truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors text-red-400 hover:text-red-300"
                        onClick={handleSignOut}
                      >
                        <LogOut className="size-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            }

            return (
              <li
                key={idx}
                className="relative h-full flex items-center justify-center"
              >
                <a
                  href={item.href}
                  data-index={idx}
                  onClick={(e) => {
                    if (item.href.startsWith("#")) {
                      e.preventDefault();
                      handleItemClick(item, idx);
                      const element = document.getElementById(
                        item.href.slice(1),
                      );
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    } else if (item.href === "/") {
                      e.preventDefault();
                      handleItemClick(item, idx);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                    // Otherwise allow default navigation
                  }}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                    activeIndex === idx
                      ? "text-white"
                      : "text-white/45 hover:text-white/85",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* 1. Spotlight (follows mouse) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-full z-[1] transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(120px circle at var(--spotlight-x) 100%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          }}
        />

        {/* 2. Ambience (active item) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
          style={{
            background: `radial-gradient(60px circle at var(--ambience-x) 0%, rgba(255,255,255,1) 0%, transparent 100%)`,
          }}
        />

        {/* 3. Bottom border track */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 z-0" />
      </nav>
    </div>
  );
}
