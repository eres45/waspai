"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export function DashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.95", "center center"],
  });

  // Apply a spring to smooth out the scroll value
  const smoothProgress = useSpring(scrollYProgress, {
    mass: 0.1,
    stiffness: 100,
    damping: 20,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 1], [0.6, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.5], [0.5, 1]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center px-6 pb-32 mt-8"
    >
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#161618] to-transparent z-10 pointer-events-none" />

      <motion.div
        style={{ scale, opacity, transformOrigin: "top center" }}
        className="w-full max-w-5xl rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_0_100px_-20px_rgba(99,102,241,0.35),0_40px_80px_-20px_rgba(0,0,0,0.7)]"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1e1e21] border-b border-white/[0.06]">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-yellow-500/70" />
          <span className="size-3 rounded-full bg-green-500/70" />
          <div className="flex-1 mx-4">
            <div className="mx-auto max-w-xs h-6 rounded-md bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
              <span className="text-[11px] text-white/30">
                waspai.vercel.app
              </span>
            </div>
          </div>
        </div>

        {/* GIF — Plain img, aspect ratio maintains layout while 9MB GIF loads */}
        <div className="relative w-full aspect-[16/10] bg-[#161618] flex items-center justify-center">
          {/* Skeleton loader text while GIF fetches */}
          <span className="absolute text-white/20 text-sm animate-pulse">
            Loading dashboard preview...
          </span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard-preview.gif"
            alt="Wasp AI dashboard preview"
            loading="lazy"
            className="w-full h-full object-cover relative z-10"
          />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#161618] to-transparent pointer-events-none z-20" />
        </div>
      </motion.div>
    </div>
  );
}
