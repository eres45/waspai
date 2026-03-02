import { Threads } from "@/components/landing/threads";
import { SpotlightNavbar } from "@/components/landing/spotlight-navbar";
import { MaskedAvatars } from "@/components/ui/masked-avatars";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { LogoSlider } from "@/components/ui/logo-slider";
import {
  OpenAI,
  Anthropic,
  Gemini,
  Meta,
  Mistral,
  Perplexity,
  HuggingFace,
  MiniMax,
  Kimi,
  DeepSeek,
  Grok,
} from "@/components/icons/ai-logos";
import { FeaturesSection } from "@/components/landing/features-section";
import { AdvancedFeatures } from "@/components/blocks/features-10";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Connect } from "@/components/landing/connect";
import { Footer } from "@/components/landing/footer";
import LightRays from "@/components/ui/light-rays";
import { getSession } from "@/lib/auth/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function RootLandingPage() {
  const session = await getSession();

  if (session) {
    redirect("/chat");
  }

  return (
    <SmoothScroll>
      <div className="relative w-full min-h-screen bg-[#161618]">
        {/* Page content */}
        <div className="relative z-10 flex flex-col">
          <SpotlightNavbar
            items={[
              { label: "Home", href: "/" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              ...(session
                ? [{ label: "Dashboard", href: "/chat" }]
                : [{ label: "Sign In", href: "/sign-in" }]),
              {
                label: "GitHub",
                href: "https://github.com/cgoinglove/better-chatbot",
              },
            ]}
          />

          <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0">
            <LightRays
              raysOrigin="top-center"
              raysColor="#ffffff"
              raysSpeed={1}
              lightSpread={0.5}
              rayLength={3}
              followMouse={true}
              mouseInfluence={0.1}
              noiseAmount={0}
              distortion={0}
              className="opacity-40"
              pulsating={false}
              fadeDistance={1}
              saturation={1}
            />
          </div>

          {/* Hero */}
          <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">
            {/* Threads — scoped to hero only */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Threads amplitude={1} distance={0} enableMouseInteraction />
            </div>
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/60 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
                <span className="size-1.5 rounded-full bg-white/40 shadow-[0_0_6px_2px_rgba(255,255,255,0.2)] animate-pulse" />
                20+ AI Models · Workflows · Image Generation
              </div>

              {/* Headline */}
              <h1
                className="max-w-4xl font-extrabold leading-[1.04] tracking-[-0.04em]"
                style={{ fontSize: "clamp(56px, 9vw, 104px)" }}
              >
                <span
                  style={{
                    display: "block",
                    background:
                      "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.82) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 2px 24px rgba(255,255,255,0.08))",
                  }}
                >
                  One AI. Every Model.
                </span>
                <span
                  style={{
                    display: "block",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.18) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Infinite Possibilities.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="mt-7 max-w-lg mx-auto text-[17px] leading-[1.7] text-white/40 font-normal">
                Chat with GPT, Claude, Gemini, Grok and 20+ models. Build
                workflow automations, create custom characters & skills,
                generate and edit images — all in one place.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                <Link href={session ? "/chat" : "/sign-up"}>
                  <Button
                    size="lg"
                    className="h-14 px-10 rounded-none bg-white text-black hover:bg-white/90 font-bold text-base shadow-xl shadow-white/5 transition-all active:scale-95"
                  >
                    {session ? "Open Dashboard" : "Get Started Now"}
                  </Button>
                </Link>
                {!session && (
                  <Link href="/sign-in">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 px-10 rounded-none border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-base transition-all active:scale-95"
                    >
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>

              {/* Social proof */}
              <div className="mt-16 flex flex-col items-center gap-3">
                <MaskedAvatars
                  avatars={[
                    {
                      avatar: "https://i.pravatar.cc/150?u=wasp1",
                      name: "Tyler",
                    },
                    {
                      avatar: "https://i.pravatar.cc/150?u=wasp2",
                      name: "Dora",
                    },
                    {
                      avatar: "https://i.pravatar.cc/150?u=wasp3",
                      name: "Johan",
                    },
                    {
                      avatar: "https://i.pravatar.cc/150?u=wasp4",
                      name: "Vegeta",
                    },
                    {
                      avatar: "https://i.pravatar.cc/150?u=wasp5",
                      name: "Robin",
                    },
                  ]}
                  size={52}
                  column={32}
                />
                <p className="text-[13px] font-semibold text-white leading-tight">
                  1,000+{" "}
                  <span className="font-normal text-white/40">
                    developers use Wasp AI daily
                  </span>
                </p>
              </div>

              {/* Tech stack */}
              <div className="mt-5 flex items-center justify-center gap-6 text-[13px] text-white/30 font-medium">
                {[
                  "Workflows",
                  "Characters",
                  "Skills",
                  "Image Gen",
                  "Image Editing",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-2">
                    <span className="size-[5px] rounded-full bg-white/20" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Dashboard Preview — scroll-driven scale */}
          <DashboardPreview />

          {/* Trusted By / Supported Models Marquee */}
          <section className="pt-32 pb-48 flex flex-col items-center">
            <p className="text-base font-medium text-white/50 tracking-[0.2em] uppercase mb-16 px-6 text-center">
              Powering AI experiences seamlessly
            </p>
            <div className="w-full max-w-5xl px-6">
              <LogoSlider
                logos={[
                  <OpenAI key="openai" />,
                  <Anthropic key="anthropic" />,
                  <Gemini key="gemini" />,
                  <Meta key="meta" />,
                  <Mistral key="mistral" />,
                  <Perplexity key="perplexity" />,
                  <HuggingFace key="hf" />,
                  <MiniMax key="minimax" />,
                  <Kimi key="kimi" />,
                  <DeepSeek key="deepseek" />,
                  <Grok key="grok" />,
                ]}
                speed={40}
                direction="left"
                showBlur={false}
                blurLayers={8}
                blurIntensity={1.5}
              />
            </div>
          </section>

          <section id="features">
            <FeaturesSection />
          </section>

          <AdvancedFeatures />

          <section id="pricing">
            <Pricing />
          </section>

          <Testimonials />

          <Connect />

          <Footer />
        </div>
      </div>
    </SmoothScroll>
  );
}
