"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Code2, BrainCircuit, Sparkles, ArrowRight } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}

const features: Feature[] = [
  {
    id: "agents",
    title: "Custom Agents",
    subtitle: "AI",
    description:
      "Create specialized AI agents with custom instructions and tool access to handle recurring tasks or brand-specific workflows.",
    icon: <Sparkles className="w-5 h-5" />,
    preview: (
      <div className="relative w-full h-full group">
        <img
          src="/landing/features/agents.gif"
          alt="Custom Agents Demo"
          loading="lazy"
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl scale-110 transform translate-x-12 translate-y-12"
        />
      </div>
    ),
  },
  {
    id: "mentions",
    title: "Quick Tool Mentions & Presets",
    subtitle: "AI",
    description:
      "@ mention any tool or skill instantly in chat. Use pre-defined skill presets to automate repetitive tasks and boost your productivity.",
    icon: <Sparkles className="w-5 h-5" />,
    preview: (
      <div className="relative w-full h-full group">
        <img
          src="/landing/features/mentions.gif"
          alt="Tool Mentions Demo"
          loading="lazy"
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl scale-110 transform translate-x-12 translate-y-12"
        />
      </div>
    ),
  },
  {
    id: "image-gen",
    title: "Image Generation",
    subtitle: "Art",
    description:
      "Generate stunning high-quality images with Flux, Stable Diffusion, and Midjourney. Professional control over style, lighting, and composition.",
    icon: <Sparkles className="w-5 h-5" />,
    preview: (
      <div className="relative w-full h-full group">
        <img
          src="/landing/features/image-gen.gif"
          alt="Image Generation Demo"
          loading="lazy"
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl scale-110 transform translate-x-12 translate-y-12"
        />
      </div>
    ),
  },
  {
    id: "workflows",
    title: "Workflow Creation",
    subtitle: "Core",
    description:
      "Build powerful, automated AI workflows. Chain multiple models, tools, and custom logic together to solve complex business problems effortlessly.",
    icon: <BrainCircuit className="w-5 h-5" />,
    preview: (
      <div className="relative w-full h-full group">
        <img
          src="/landing/features/workflows.png"
          alt="Workflow Creation Demo"
          loading="lazy"
          className="w-full h-full object-cover p-2 opacity-90 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"
        />
      </div>
    ),
  },
  {
    id: "executor",
    title: "JS, PYTHON Executor",
    subtitle: "Code",
    description:
      "Write, test, and execute Javascript and Python code in real-time. Integrated sandbox environment for rapid prototyping and debugging.",
    icon: <Code2 className="w-5 h-5" />,
    preview: (
      <div className="relative w-full h-full group">
        <img
          src="/landing/features/executor.gif"
          alt="JS/Python Executor Demo"
          loading="lazy"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl scale-110"
        />
      </div>
    ),
  },
];

export const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Track window width for mobile behavior
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (isMobile) return;

    const step = 1 / features.length;
    const currentIdx = Math.min(Math.floor(latest / step), features.length - 1);

    if (currentIdx !== activeIdx) {
      setActiveIdx(currentIdx);
    }
  });

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] lg:h-[500vh] bg-[#161618]">
      <section className="sticky top-0 min-h-screen w-full flex items-center py-16 lg:py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            {/* Left Column: Title and Feature List */}
            <div className="lg:col-span-5 flex flex-col pt-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="mb-8 lg:mb-20"
              >
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 lg:mb-8 tracking-tight leading-[1.05]">
                  Create,
                  <br />
                  collaborate,
                  <br />
                  and go live
                </h2>
              </motion.div>

              <div className="flex flex-col border-t border-white/10">
                {features.map((feature, idx) => (
                  <button
                    key={feature.id}
                    onClick={() => {
                      if (isMobile) {
                        setActiveIdx(idx);
                      } else {
                        const scrollPos =
                          (idx / features.length) *
                          (containerRef.current?.offsetHeight || 0);
                        window.scrollTo({
                          top:
                            (containerRef.current?.offsetTop || 0) +
                            scrollPos +
                            10,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="group relative w-full text-left py-4 lg:py-8 border-b border-white/10 transition-all duration-300 outline-none"
                  >
                    <div className="flex flex-col">
                      <div
                        className={`transition-all duration-500 mb-1 ${
                          activeIdx === idx
                            ? "text-white"
                            : "text-white/40 group-hover:text-white/60"
                        }`}
                      >
                        {activeIdx === idx && (
                          <div className="text-[10px] lg:text-[12px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1 lg:mb-3">
                            {feature.subtitle}
                          </div>
                        )}
                        <h3 className="text-xl lg:text-3xl font-bold">{feature.title}</h3>
                      </div>

                      <AnimatePresence mode="wait">
                        {activeIdx === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="overflow-hidden"
                          >
                            <p className="text-white/50 text-[15px] lg:text-[17px] leading-relaxed mb-4 lg:mb-6 mt-1 lg:mt-2 max-w-[95%] lg:max-w-[90%] font-medium">
                              {feature.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white group/link cursor-pointer transition-colors">
                              Learn more{" "}
                              <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Preview Area */}
            <div className="hidden lg:flex lg:col-span-7 items-center justify-center lg:sticky lg:top-32">
              <div className="relative w-full aspect-[4/3] rounded-3xl bg-white/[0.03] border border-white/[0.08] shadow-[2xl] backdrop-blur-3xl group transform translate-x-6 xl:translate-x-12 translate-y-6 xl:translate-y-12 overflow-hidden">
                {features.map((feature, idx) => (
                  <motion.div
                    key={feature.id}
                    initial={false}
                    animate={{
                      opacity: activeIdx === idx ? 1 : 0,
                      scale: activeIdx === idx ? 1 : 0.9,
                      y: activeIdx === idx ? 0 : 20,
                      visibility: activeIdx === idx ? "visible" : "hidden",
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      opacity: { duration: 0.3 },
                    }}
                    className="absolute inset-0 w-full h-full flex items-center justify-center p-0 pointer-events-none"
                  >
                    {feature.preview}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet Preview: Shown below the active feature */}
            {isMobile && (
              <div className="mt-8 block lg:hidden w-full aspect-[4/3] rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
                 <AnimatePresence mode="wait">
                  <motion.div
                    key={features[activeIdx].id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {features[activeIdx].preview}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
