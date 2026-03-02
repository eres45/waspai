"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoSliderProps {
  logos: React.ReactNode[];
  speed?: number;
  direction?: "left" | "right";
  showBlur?: boolean;
  blurLayers?: number;
  blurIntensity?: number;
  className?: string;
  pauseOnHover?: boolean;
}

export const LogoSlider = ({
  logos,
  speed = 60,
  direction = "left",
  showBlur = true,
  blurLayers = 8,
  blurIntensity = 1,
  className,
  pauseOnHover = false,
}: LogoSliderProps) => {
  return (
    <div
      className={cn("logo-slider w-full overflow-hidden", className)}
      style={
        {
          "--speed": speed,
          "--count": logos.length,
          "--blurs": blurLayers,
          "--blur": blurIntensity,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "logo-slider__container",
          "relative w-full h-[60px] sm:h-[80px] flex items-center",
        )}
        data-direction={direction}
        data-pause-on-hover={pauseOnHover}
      >
        {showBlur && (
          <div className="logo-slider__blur logo-slider__blur--left absolute top-0 bottom-0 left-0 w-1/4 z-10 pointer-events-none rotate-180">
            {Array.from({ length: blurLayers }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{ "--blur-index": i } as React.CSSProperties}
              />
            ))}
          </div>
        )}
        {showBlur && (
          <div className="logo-slider__blur logo-slider__blur--right absolute top-0 bottom-0 right-0 w-1/4 z-10 pointer-events-none">
            {Array.from({ length: blurLayers }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{ "--blur-index": i } as React.CSSProperties}
              />
            ))}
          </div>
        )}
        <ul className="logo-slider__track flex items-center h-full w-fit m-0 p-0 list-none">
          {logos.map((logo, index) => (
            <li
              key={index}
              className="logo-slider__item flex h-full w-[220px] sm:w-[280px] lg:w-[340px] items-center justify-center shrink-0 px-12"
              style={{ "--item-index": index } as React.CSSProperties}
            >
              <div className="w-full h-full flex items-center justify-center [&>div]:w-auto [&>div]:h-full [&>div]:max-h-[40px] sm:[&>div]:max-h-[52px] [&>svg]:w-auto [&>svg]:h-full [&>svg]:max-h-[40px] sm:[&>svg]:max-h-[52px] [&>img]:w-auto [&>img]:h-full [&>img]:max-h-[40px] sm:[&>img]:max-h-[52px] [&>img]:object-contain transition-all hover:scale-105">
                {logo}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

LogoSlider.displayName = "LogoSlider";
export default LogoSlider;
