import { Metadata } from "next";
import { Threads } from "@/components/landing/threads";
import { SpotlightNavbar } from "@/components/landing/spotlight-navbar";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { Footer } from "@/components/landing/footer";
import { getSession } from "@/lib/auth/server";
import { ContactChat } from "@/components/contact/contact-chat";
import {
  Mail,
  MessageSquare,
  MapPin,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact Us | Wasp AI",
  description:
    "Get in touch with the Wasp AI team for support, business inquiries, or feedback.",
};

export default async function ContactPage() {
  const session = await getSession();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Contact", href: "/contact" },
    ...(session
      ? [{ label: "Dashboard", href: "/chat" }]
      : [{ label: "Sign In", href: "/sign-in" }]),
  ];

  return (
    <SmoothScroll>
      <div className="relative w-full min-h-screen bg-[#161618] text-white overflow-hidden">
        {/* Navbar */}
        <div className="relative z-50">
          <SpotlightNavbar items={navItems} user={session?.user} />
        </div>

        {/* Hero Background */}
        <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0">
          <Threads amplitude={1} distance={0} enableMouseInteraction />
        </div>

        <main className="relative z-10 pt-24 pb-32 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[13px] font-medium text-white/60 backdrop-blur-md mb-8">
                <Sparkles className="size-3.5 text-indigo-400" />
                <span>We&apos;re here to help</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                Get in touch
              </h1>
              <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Have questions about Wasp AI? Whether you need technical
                support, have business inquiries, or just want to say hi,
                we&apos;re all ears.
              </p>
            </div>

            {/* Contact Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 text-white">
              <ContactCard
                icon={Mail}
                title="Email Support"
                description="For general inquiries and technical support. We respond within 24h."
                value="support@waspai.in"
                href="mailto:support@waspai.in"
              />
              <ContactCard
                icon={MessageSquare}
                title="Community"
                description="Join our Discord to chat with other users and get real-time help."
                value="Join Discord"
                href="https://discord.gg/gCRu69Upnp"
              />
              <ContactCard
                icon={MapPin}
                title="HQ Location"
                description="Our digital headquarters. Operating globally from India."
                value="Digital HQ, India"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 bg-white/[0.02] border border-white/10 p-8 md:p-16 relative overflow-hidden">
              <CardDecorator />
              <div className="relative z-10 text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[13px] font-medium text-indigo-400 mb-6">
                  <Sparkles className="size-3.5" />
                  <span>Instant Assistance</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                  Have a specific question?
                </h2>
                <p className="text-white/40 text-lg mb-10 max-w-xl leading-relaxed">
                  Chat with our AI assistant for instant answers. If you still
                  need help, you can contact us directly through the bot or via
                  email.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="mailto:support@waspai.in">
                    <button className="px-8 py-4 rounded-full border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-lg">
                      Email Support
                    </button>
                  </Link>
                  <Link href="https://discord.gg/gCRu69Upnp" target="_blank">
                    <button className="px-8 py-4 rounded-full bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-lg border border-white/5">
                      Join Discord
                    </button>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 w-full flex justify-center lg:justify-end">
                <ContactChat />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Clock className="size-5 text-indigo-400" />
                </div>
                <div>
                  <dt className="font-bold text-lg mb-1">Response Time</dt>
                  <dd className="text-white/40 leading-relaxed">
                    We aim to respond to all inquiries within 24-48 hours. Our
                    team is available Monday through Friday.
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="size-5 text-indigo-400" />
                </div>
                <div>
                  <dt className="font-bold text-lg mb-1">Feedback</dt>
                  <dd className="text-white/40 leading-relaxed">
                    Your feedback drives our roadmap. Don&apos;t hesitate to
                    share feature requests or improvement ideas.
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </SmoothScroll>
  );
}

const ContactCard = ({
  icon: Icon,
  title,
  description,
  value,
  href,
}: {
  icon: any;
  title: string;
  description: string;
  value: string;
  href?: string;
}) => (
  <Card className="group relative rounded-none shadow-none border-white/10 bg-[#161618] overflow-hidden transition-all duration-300 hover:border-white/20">
    <CardDecorator />
    <CardHeader className="p-8 pb-4">
      <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
        <Icon className="size-6" />
      </div>
      <CardTitle className="text-2xl font-bold mb-2 text-white">
        {title}
      </CardTitle>
      <CardDescription className="text-white/40 text-[15px] leading-relaxed">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-8 pt-4">
      {href ? (
        <Link
          href={href}
          className="text-white font-bold text-lg hover:text-indigo-400 transition-colors inline-flex items-center gap-2 group/link"
        >
          {value}
          <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      ) : (
        <span className="text-white font-bold text-lg">{value}</span>
      )}
    </CardContent>
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-white/20 absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-white/20 absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-white/20 absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-white/20 absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
);
