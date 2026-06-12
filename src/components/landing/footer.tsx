"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { ArrowUpRight } from "lucide-react";

export const Footer = () => {
  const { data: session } = authClient.useSession();
  const getStartedHref = session ? "/chat" : "/sign-in";

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Workflows", href: "/workflows" },
        { label: "Agents", href: "/ai-agents" },
        { label: "Pricing", href: "/subscription" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/docs" },
        { label: "API Reference", href: "/api" },
        {
          label: "GitHub",
          href: "https://github.com/eres45/waspai",
          external: true,
        },
        {
          label: "Discord",
          href: "https://discord.gg/gCRu69Upnp",
          external: true,
        },
      ],
    },
    {
      title: "Legal & Status",
      links: [
        { label: "System Status", href: "/status" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refund" },
        { label: "Shipping Policy", href: "/shipping" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Contact Support", href: "/contact" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
      ],
    },
  ];

  return (
    <footer className="relative w-full bg-[#161618] pt-32 pb-12 px-6 overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          {/* Left Column: CTA */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">
                Experience liftoff
              </h2>
              <p className="text-white/40 text-lg max-w-sm mb-8 leading-relaxed">
                Join 1,000+ developers building the future of AI automation with
                Wasp AI.
              </p>
              <Link
                href={getStartedHref}
                className="group inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-white/90 transition-all duration-300"
              >
                Get Started
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Links */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12">
            {footerLinks.map((column, idx) => (
              <div key={idx} className="flex flex-col">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 text-xs">
                  {column.title}
                </h4>
                <ul className="space-y-4">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        className="text-[15px] text-white/40 hover:text-white transition-colors duration-200 inline-flex items-center gap-1 group"
                      >
                        {link.label}
                        {link.external && (
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Main Branding: WASPAI */}
        <div className="relative mt-20 mb-16 select-none pointer-events-none">
          <motion.h1
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-[15vw] lg:text-[18vw] font-black text-white/[0.03] leading-none tracking-tighter text-center whitespace-nowrap py-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            WASPAI
          </motion.h1>
        </div>

        {/* Sub-Footer */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-white tracking-widest uppercase">
              WASPAI
            </span>
            <p className="text-[13px] text-white/30 font-medium">
              © 2026 WaspAI Inc. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Refund Policy", href: "/refund" },
              { label: "Shipping Policy", href: "/shipping" },
            ].map((legal) => (
              <Link
                key={legal.label}
                href={legal.href}
                className="text-[13px] text-white/30 hover:text-white/60 transition-colors font-medium"
              >
                {legal.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
