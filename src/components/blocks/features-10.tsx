import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, LucideIcon, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import Image from "next/image";

export function AdvancedFeatures() {
  return (
    <section className="py-12 md:py-24 lg:py-32 bg-transparent">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl text-white">
        <div className="mx-auto grid gap-4 lg:grid-cols-2">
          <FeatureCard>
            <CardHeader className="pb-3 px-4 md:px-6">
              <CardHeading
                icon={Sparkles}
                title="Multi-Model Ecosystem"
                description="Switch between 20+ models instantly including Gemini, Claude, and DeepSeek."
              />
            </CardHeader>

            <div className="relative mb-6 border-t border-dashed border-white/5 sm:mb-0 overflow-hidden">
              {/* Spotlight Mask */}
              <div className="absolute inset-0 z-10 [background:radial-gradient(circle_at_50%_40%,transparent_20%,#161618_75%)]"></div>
              <div className="aspect-[76/59] p-1 px-4 md:px-6 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                <DualModeImage
                  darkSrc="https://tailark.com/_next/image?url=%2Fpayments.png&w=3840&q=75"
                  lightSrc="https://tailark.com/_next/image?url=%2Fpayments-light.png&w=3840&q=75"
                  alt="payments illustration"
                  width={1207}
                  height={929}
                  forceDark
                />
              </div>
            </div>
          </FeatureCard>

          <FeatureCard>
            <CardHeader className="pb-3 px-4 md:px-6">
              <CardHeading
                icon={Calendar}
                title="Autonomous Skill Agents"
                description="Deploy specialized agents with deep tool access for complex recurring tasks."
              />
            </CardHeader>

            <CardContent>
              <div className="relative mb-6 sm:mb-0 pb-10 px-4 md:px-6">
                {/* Spotlight Mask */}
                <div className="absolute inset-0 z-10 [background:radial-gradient(circle_at_75%_50%,transparent_10%,#161618_70%)]"></div>
                <div className="aspect-[76/59] border border-white/5 overflow-hidden rounded-md opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                  <DualModeImage
                    darkSrc="https://tailark.com/_next/image?url=%2Forigin-cal-dark.png&w=3840&q=75"
                    lightSrc="https://tailark.com/_next/image?url=%2Forigin-cal.png&w=3840&q=75"
                    alt="calendar illustration"
                    width={1207}
                    height={929}
                    forceDark
                  />
                </div>
              </div>
            </CardContent>
          </FeatureCard>

          <FeatureCard className="p-8 lg:p-12 lg:col-span-2 bg-white/[0.01]">
            <p className="mx-auto my-4 lg:my-6 max-w-xl text-balance text-center text-xl md:text-2xl font-semibold">
              The most powerful environment for building, testing, and scaling
              AI-first applications.
            </p>

            <div className="flex justify-center gap-4 md:gap-6 overflow-hidden mt-6">
              <CircularUI
                label="Orchestration"
                circles={[{ pattern: "border" }, { pattern: "border" }]}
              />

              <CircularUI
                label="Execution"
                circles={[{ pattern: "none" }, { pattern: "primary" }]}
              />

              <CircularUI
                label="Tooling"
                circles={[{ pattern: "blue" }, { pattern: "none" }]}
              />

              <CircularUI
                label="Memory"
                circles={[{ pattern: "primary" }, { pattern: "none" }]}
                className="hidden sm:block"
              />
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card
    className={cn(
      "group relative rounded-none shadow-none border-white/10 bg-[#161618]",
      className,
    )}
  >
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-white/40 absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-white/40 absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-white/40 absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-white/40 absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
);

interface CardHeadingProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div className="p-8">
    <span className="text-white/60 flex items-center gap-2 font-medium tracking-wide text-sm uppercase opacity-90">
      <Icon className="size-4" />
      {title}
    </span>
    <p className="mt-6 text-2xl font-bold text-white leading-tight">
      {description}
    </p>
  </div>
);

interface DualModeImageProps {
  darkSrc: string;
  lightSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  forceDark?: boolean;
}

const DualModeImage = ({
  darkSrc,
  lightSrc,
  alt,
  width,
  height,
  className,
  forceDark,
}: DualModeImageProps) => (
  <>
    <Image
      src={forceDark ? darkSrc : darkSrc}
      className={cn(
        forceDark ? "block" : "hidden dark:block",
        "object-cover w-full h-full opacity-80",
        className,
      )}
      alt={`${alt} dark`}
      width={width}
      height={height}
      unoptimized
    />
    {!forceDark && (
      <Image
        src={lightSrc}
        className={cn(
          "shadow dark:hidden object-cover w-full h-full",
          className,
        )}
        alt={`${alt} light`}
        width={width}
        height={height}
        unoptimized
      />
    )}
  </>
);

interface CircleConfig {
  pattern: "none" | "border" | "primary" | "blue";
}

interface CircularUIProps {
  label: string;
  circles: CircleConfig[];
  className?: string;
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
  <div className={cn("flex flex-col items-center", className)}>
    <div className="bg-white/10 size-fit rounded-2xl p-px">
      <div className="bg-[#161618] relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
        {circles.map((circle, i) => (
          <div
            key={i}
            className={cn("size-7 rounded-full border sm:size-8", {
              "border-white/20 bg-white/5": circle.pattern === "none",
              "border-white/20 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.05),rgba(255,255,255,0.05)_1px,transparent_1px,transparent_4px)]":
                circle.pattern === "border",
              "border-white/40 bg-[#222226] bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_1px,transparent_1px,transparent_4px)]":
                circle.pattern === "primary",
              "bg-[#222226] z-1 border-white/60 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.2),rgba(255,255,255,0.2)_1px,transparent_1px,transparent_4px)]":
                circle.pattern === "blue",
            })}
          ></div>
        ))}
      </div>
    </div>
    <span className="text-white/40 mt-3 block text-center text-[10px] font-bold uppercase tracking-widest leading-none">
      {label}
    </span>
  </div>
);
