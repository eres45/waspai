"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DIcons } from "dicons";
import { useAnimate } from "framer-motion";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  HighlighterItem,
  HighlightGroup,
  Particles,
} from "@/components/ui/highlighter";

export function Connect() {
  const [scope, animate] = useAnimate();

  React.useEffect(() => {
    animate(
      [
        ["#pointer", { left: 200, top: 60 }, { duration: 0 }],
        ["#javascript", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 50, top: 102 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#javascript", { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
        ["#react-js", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 224, top: 170 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#react-js", { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
        ["#typescript", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 88, top: 198 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#typescript", { opacity: 0.4 }, { at: "-0.3", duration: 0.1 }],
        ["#next-js", { opacity: 1 }, { duration: 0.3 }],
        [
          "#pointer",
          { left: 200, top: 60 },
          { at: "+0.5", duration: 0.5, ease: "easeInOut" },
        ],
        ["#next-js", { opacity: 0.5 }, { at: "-0.3", duration: 0.1 }],
      ],
      {
        repeat: Number.POSITIVE_INFINITY,
      },
    );
  }, [animate]);

  return (
    <section className="relative mx-auto mb-20 mt-6 max-w-5xl px-6">
      <HighlightGroup className="group h-full">
        <div
          className="group/item h-full md:col-span-6 lg:col-span-12"
          data-aos="fade-down"
        >
          <HighlighterItem className="rounded-3xl p-6">
            <div className="relative z-20 h-full overflow-hidden rounded-3xl border border-white/10 bg-[#161618] shadow-2xl backdrop-blur-3xl">
              <Particles
                className="absolute inset-0 -z-10 opacity-10 transition-opacity duration-1000 ease-in-out group-hover/item:opacity-100"
                quantity={200}
                color={"#555555"}
                vy={-0.2}
              />
              <div className="flex justify-center">
                <div className="flex h-full flex-col justify-center gap-10 p-4 md:h-[300px] md:flex-row">
                  <div
                    className="relative mx-auto h-[270px] w-[300px] md:h-[270px] md:w-[300px]"
                    ref={scope}
                  >
                    <DIcons.Designali className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white" />
                    <div
                      id="next-js"
                      className="absolute bottom-12 left-14 rounded-3xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/50 opacity-50 backdrop-blur-sm"
                    >
                      UI-UX
                    </div>
                    <div
                      id="react-js"
                      className="absolute left-2 top-20 rounded-3xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/50 opacity-50 backdrop-blur-sm"
                    >
                      Graphic Design
                    </div>
                    <div
                      id="typescript"
                      className="absolute bottom-20 right-1 rounded-3xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/50 opacity-50 backdrop-blur-sm"
                    >
                      Web Application
                    </div>
                    <div
                      id="javascript"
                      className="absolute right-12 top-10 rounded-3xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/50 opacity-50 backdrop-blur-sm"
                    >
                      Branding
                    </div>

                    <div id="pointer" className="absolute">
                      <svg
                        width="16.8"
                        height="18.2"
                        viewBox="0 0 12 13"
                        className="fill-indigo-500"
                        stroke="white"
                        strokeWidth="1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 5.50676L0 0L2.83818 13L6.30623 7.86537L12 5.50676V5.50676Z"
                        />
                      </svg>
                      <span className="relative -top-1 left-3 rounded-3xl bg-indigo-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                        Wasp
                      </span>
                    </div>
                  </div>

                  <div className="-mt-12 flex h-full flex-col justify-center p-2 md:mt-0 md:ml-10 md:w-[400px]">
                    <div className="flex flex-col items-start text-left">
                      <h3 className="pb-1 font-bold text-white">
                        <span className="text-2xl md:text-4xl tracking-tight leading-tight">
                          Don&apos;t settle for average. Switch to Wasp AI today
                          and
                        </span>
                      </h3>
                    </div>
                    <p className="mb-8 mt-2 text-white/40 text-lg font-medium leading-relaxed">
                      Feel free to reach out to us! We&apos;re here to help you
                      scale your AI development.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={"https://cal.com/aliimam/designali"}
                        target="_blank"
                      >
                        <Button className="rounded-full px-8 py-6 font-bold bg-white text-black hover:bg-white/90">
                          Book a call
                        </Button>
                      </Link>
                      <Link
                        href="mailto:contact@designali.in"
                        target="_blank"
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "icon",
                          }),
                          "rounded-full size-12 border-white/10 bg-white/5 hover:bg-white/10 transition-colors",
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <DIcons.Mail
                            strokeWidth={1}
                            className="h-5 w-5 text-white/80"
                          />
                        </span>
                      </Link>
                      <Link
                        href="https://wa.me/917678432186"
                        target="_blank"
                        className={cn(
                          buttonVariants({
                            variant: "outline",
                            size: "icon",
                          }),
                          "rounded-full size-12 border-white/10 bg-white/5 hover:bg-white/10 transition-colors",
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <DIcons.WhatsApp
                            strokeWidth={1}
                            className="h-4 w-4 text-white/80"
                          />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </HighlighterItem>
        </div>
      </HighlightGroup>
    </section>
  );
}
