import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cpu, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | WASPAI",
  description: "Learn more about WASPAI, our mission, and the team behind the next generation of AI automation.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white selection:bg-white/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0C0C0E]/80 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="text-sm font-bold tracking-widest uppercase">WASPAI</div>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <section className="mb-24 text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              Building the future of <span className="text-white/40 italic">AI Autonomy.</span>
            </h1>
            <p className="text-xl text-white/40 leading-relaxed max-w-2xl mx-auto">
              WASPAI is 2026's leading multi-model AI platform, designed to empower developers and creatives with seamless access to world-class intelligence.
            </p>
          </section>

          {/* Mission Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            {[
              {
                icon: Cpu,
                title: "Intelligence",
                desc: "Accessing the world's most powerful LLMs under one unified interface."
              },
              {
                icon: Shield,
                title: "Privacy",
                desc: "Your data is yours. We prioritize security and ethical AI practices."
              },
              {
                icon: Zap,
                title: "Speed",
                desc: "Optimized for liftoff. Near-instant responses across all our systems."
              }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                <item.icon className="w-8 h-8 mb-6 text-white/40 group-hover:text-white transition-colors" />
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </section>

          {/* Legal Identity Section (Crucial for Razorpay) */}
          <section className="p-12 rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent mb-32">
            <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest">Legal Ownership & Identity</h2>
            <div className="space-y-6 text-center max-w-2xl mx-auto">
              <p className="text-lg text-white/60 italic leading-relaxed">
                "WASPAI is more than just a tool; it's a commitment to making advanced intelligence accessible to everyone with minimal friction."
              </p>
              <div className="pt-6 border-t border-white/5">
                <p className="text-white font-bold text-xl uppercase tracking-widest">Ronit Bhavesh Shrimankar</p>
                <p className="text-white/40 text-sm mt-2">Founder & Sole Proprietor</p>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase mb-4 opacity-40">Registered Portal</h4>
                  <p className="text-white/60 font-mono">https://www.waspai.in</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase mb-4 opacity-40">Legal Entity</h4>
                  <p className="text-white/60">Individual Proprietorship</p>
                </div>
              </div>
            </div>
          </section>

          {/* Story Section */}
          <section className="prose prose-invert max-w-none mb-32">
            <h2 className="text-3xl font-bold mb-8">Our Journey</h2>
            <div className="text-white/50 space-y-6 text-lg leading-relaxed">
              <p>
                Founded in 2026, WASPAI (formerly known as Better Chatbot) began as a mission to bridge the gap between complex AI models and user-friendly interfaces. We believe that intelligence shouldn't be gated by technical complexity.
              </p>
              <p>
                Today, WASPAI supports dozens of specialized models for coding, image generation, video creation, and high-level reasoning. Our platform is managed with a focus on reliability, performance, and the developer-first aesthetic.
              </p>
            </div>
          </section>

          {/* Final Call */}
          <section className="text-center py-20 border-y border-white/5">
            <h2 className="text-4xl font-bold mb-8">Ready for liftoff?</h2>
            <Link 
              href="/auth"
              className="bg-white text-black px-12 py-4 rounded-full font-bold hover:scale-105 active:scale-95 transition-all inline-block"
            >
              Get Started Now
            </Link>
          </section>
        </div>
      </main>

      {/* Basic Footer for Page */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          © 2026 WASPAI. Owned & Operated by Ronit Bhavesh Shrimankar.
        </p>
      </footer>
    </div>
  );
}
