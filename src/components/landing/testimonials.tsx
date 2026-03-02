"use client";

import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Wasp AI has completely changed how we handle multi-model deployments. The ability to switch between Claude and Gemini instantly is a game-changer.",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Briana Patton",
    role: "Lead Frontend Developer",
  },
  {
    text: "The integration with DeepSeek and Grok is incredibly fast. Wasp AI makes it effortless to build high-performance AI features.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Bilal Ahmed",
    role: "Fullstack Engineer",
  },
  {
    text: "Building complex AI workflows used to take weeks. With Wasp AI's presets, we were live in just a few days. Exceptional developer experience.",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Saman Malik",
    role: "AI Product Lead",
  },
  {
    text: "Finally, a tool that understands the needs of modern AI engineering. The seamless multi-provider support is exactly what we needed.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Omar Raza",
    role: "CTO @ TechFlow",
  },
  {
    text: "The prompt optimization features and built-in presets have significantly improved our AI response quality. Highly recommend!",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Zainab Hussain",
    role: "Senior ML Engineer",
  },
  {
    text: "Setting up Wasp AI was incredibly quick. The documentation and component library made it easy for our team to adopt it immediately.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Aliza Khan",
    role: "Software Architect",
  },
  {
    text: "Our users are loving the speed of our new AI features. Wasp AI's integration with high-speed providers like Groq is a huge win.",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Farhan Siddiqui",
    role: "Head of Engineering",
  },
  {
    text: "Wasp AI delivered exactly what they promised: a unified, powerful, and scalable AI infrastructure for our entire product suite.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Sana Sheikh",
    role: "VP of Product",
  },
  {
    text: "Monitoring and managing we multiple LLMs has never been this easy. Wasp AI is the missing piece in our AI stack.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Hassan Ali",
    role: "DevOps Engineer",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export function Testimonials() {
  return (
    <section className="bg-background my-20 relative overflow-hidden">
      <div className="container z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="border border-white/10 bg-white/5 py-1 px-4 rounded-lg text-sm text-white/70">
              Testimonials
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
            What our users say
          </h2>
          <p className="mt-6 text-white/50 text-lg">
            See how Wasp AI is transforming development workflows for teams
            everywhere.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-16 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
}
