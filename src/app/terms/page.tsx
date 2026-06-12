import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Wasp AI",
  description:
    "Terms of Service for WASPAI. Review the terms governing your use of our platform.",
};

const TOC = [
  { id: "section-1", title: "1. Acceptance of Terms" },
  { id: "section-2", title: "2. Description of Service" },
  { id: "section-3", title: "3. Account Registration" },
  { id: "section-4", title: "4. Acceptable Use Policy" },
  { id: "section-5", title: "5. AI-Generated Content" },
  { id: "section-6", title: "6. Intellectual Property" },
  { id: "section-7", title: "7. Subscription & Payments" },
  { id: "section-8", title: "8. Tier Limits & Fair Use" },
  { id: "section-9", title: "9. Disclaimer of Warranties" },
  { id: "section-10", title: "10. Limitation of Liability" },
  { id: "section-11", title: "11. Termination" },
  { id: "section-12", title: "12. Governing Law" },
  { id: "section-13", title: "13. Contact Information" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-purple-500/30 selection:text-white font-sans antialiased">
      {/* Top Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-all duration-300">
              W
            </div>
            <span className="font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">
              WASPAI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="text-sm bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-lg transition-all duration-200"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sticky Left Sidebar (desktop only) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto pr-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                Table of Contents
              </p>
              <nav className="space-y-1">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-neutral-400 hover:text-white hover:pl-1 transition-all py-1.5"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Column: Document Details */}
          <div className="flex-1 min-w-0 max-w-3xl">
            {/* Last updated badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-300 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              Last Updated: June 12, 2026
            </div>

            {/* Gradient Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-white to-neutral-400 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-neutral-400 font-light mb-10 leading-relaxed">
              These Terms of Service govern your access to and use of Wasp AI
              solutions. Please read them carefully before using our platform.
            </p>

            <div className="h-px bg-white/5 mb-10" />

            {/* Terms Sections */}
            <div className="space-y-12">
              {/* Section 1 */}
              <section id="section-1" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    01
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Acceptance of Terms
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    By accessing and using <strong>WASPAI</strong> (waspai.in)
                    (&quot;Service&quot;), which is owned and operated by{" "}
                    <strong>Eres</strong>, you accept and agree to be bound by
                    the terms and provisions of this agreement.
                  </p>
                  <p>
                    If you do not agree to these terms, you must not access or
                    use our Service. We reserve the right to modify these terms
                    at any time, and your continued usage of the service
                    constitutes your agreement to all subsequent updates.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="section-2" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    02
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Description of Service
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Wasp AI is a multi-model artificial intelligence client
                    platform. The Service includes but is not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Access to a consolidated chat gateway connecting to models
                      such as GPT, Claude, Gemini, Grok, and DeepSeek.
                    </li>
                    <li>
                      Built-in tools including web search, image generation,
                      custom video generation, sandboxed code execution, and
                      file tools.
                    </li>
                    <li>
                      Interactive AI agent configuration, multi-step node canvas
                      workflow automation, and cross-session short/long term
                      memory.
                    </li>
                  </ul>
                  <p>
                    We assume no responsibility for the timeliness, deletion,
                    mis-delivery, or failure to store any user conversation
                    history or settings.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section id="section-3" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    03
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Account Registration & Security
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    To access advanced features, you must register for an
                    account:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      You must be at least 13 years of age. If you are under 18,
                      you must have parental/guardian consent.
                    </li>
                    <li>
                      You are responsible for maintaining the confidentiality of
                      your session tokens, password, or login credentials.
                    </li>
                    <li>
                      You agree to provide true, accurate, and current profile
                      information.
                    </li>
                    <li>
                      Only one user account is allowed per individual. Sharing
                      accounts or keys is strictly prohibited.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section id="section-4" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    04
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Acceptable Use Policy
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>You agree that you will not use Wasp AI to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Generate content that is illegal, defamatory, abusive,
                      harassing, threatening, hateful, or promotes
                      violence/hate.
                    </li>
                    <li>
                      Infringe upon the copyrights, intellectual property, or
                      privacy rights of any third party.
                    </li>
                    <li>
                      Spam, scan, crawl, or run automated scripts to scrape the
                      platform beyond the limits of allowed workflow usage.
                    </li>
                    <li>
                      Attempt to bypass rate limiting, reverse engineer our
                      server APIs, or introduce malware, worms, or trojans.
                    </li>
                    <li>
                      Generate deepfakes, non-consensual media, or material
                      intended to mislead or deceive electors or the public.
                    </li>
                  </ul>
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-sm">
                    <strong>Abuse Notice:</strong> We monitor execution volumes
                    and rate patterns. Accounts found attempting API bypasses or
                    brute-forcing workflows will be terminated immediately.
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section id="section-5" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    05
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    AI-Generated Content Disclaimer
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    You understand that all outputs (text responses, images,
                    code, files) are generated by advanced machine learning
                    models:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">Accuracy:</strong> Outputs
                      may occasionally contain factual errors, hallucinatory
                      remarks, or outdated technical claims. We offer zero
                      guarantees regarding outputs.
                    </li>
                    <li>
                      <strong className="text-white">
                        Professional Reliance:
                      </strong>{" "}
                      AI-generated outputs are not a substitute for professional
                      legal, medical, or financial advice. Never take actions
                      with critical financial or health impacts based on Wasp AI
                      output alone.
                    </li>
                    <li>
                      <strong className="text-white">Responsibility:</strong>{" "}
                      The user assumes all liability for reviewing, verifying,
                      and deciding how to deploy or rely on outputs.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section id="section-6" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    06
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Intellectual Property Rights
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>Our respective IP scopes are defined as follows:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">Platform IP:</strong> The
                      Wasp AI logo, codebase, visual layout, design system,
                      dashboard interfaces, and domain (waspai.in) are owned
                      exclusively by Eres.
                    </li>
                    <li>
                      <strong className="text-white">Generated Content:</strong>{" "}
                      To the extent permitted by law, any content (text,
                      prompts, images, workflows) you generate belongs to you,
                      subject to the licensing terms of the underlying model
                      providers (e.g. OpenAI, Anthropic).
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 7 */}
              <section id="section-7" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    07
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Subscription & Payments
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Paid subscription plans (Pro, Ultra) are structured as
                    follows:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">Billing cycle:</strong>{" "}
                      Charged on a recurring monthly basis from the date of
                      activation.
                    </li>
                    <li>
                      <strong className="text-white">Auto-Renewal:</strong>{" "}
                      Subscriptions automatically renew using the card/UPI saved
                      via Razorpay unless cancelled prior to renewal.
                    </li>
                    <li>
                      <strong className="text-white">
                        Price Modifications:
                      </strong>{" "}
                      Eres reserves the right to adjust subscription rates with
                      at least 30 days notice to active subscribers.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section id="section-8" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    08
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Usage Tiers & Fair Use Limit
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    To ensure high service availability, Wasp AI employs limit
                    thresholds across plans:
                  </p>
                  <p>
                    If your account uses resources beyond reasonable personal or
                    team usage thresholds (e.g., continuous automated API calls
                    that clog queue latency), we reserve the right to throttle
                    your account access, delay model responses, or ask you to
                    upgrade your plan.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section id="section-9" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    09
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Disclaimer of Warranties
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-blue-200/90 text-sm">
                    <strong>Service Level Disclaimer:</strong> Wasp AI is
                    provided on an &quot;AS IS&quot; and &quot;AS
                    AVAILABLE&quot; basis. Eres makes no warranties, express or
                    implied, including but not limited to the merchantability,
                    fitness for a particular purpose, or uninterrupted
                    availability. AI APIs are dependent on external providers;
                    we do not guarantee constant model availability or uptime.
                  </div>
                </div>
              </section>

              {/* Section 10 */}
              <section id="section-10" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    10
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Limitation of Liability
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    To the maximum extent permitted by applicable law, Eres and
                    Wasp AI shall not be liable for any indirect, incidental,
                    special, consequential, or punitive damages, including loss
                    of profits, data, or business opportunities.
                  </p>
                  <p>
                    In no event shall our cumulative liability exceed the total
                    amount paid by you to Wasp AI in the three (3) months
                    preceding the event giving rise to such liability.
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section id="section-11" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    11
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Termination of Service
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    You are free to terminate your account and stop using the
                    service at any time. We also reserve the right to suspend or
                    delete your account immediately without notice or liability
                    if:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      You violate the Acceptable Use policy or other clauses of
                      these Terms.
                    </li>
                    <li>
                      Payment failures remain unresolved for more than 7 days.
                    </li>
                    <li>
                      Requested by law enforcement or government authorities.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 12 */}
              <section id="section-12" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    12
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Governing Law & Dispute Resolution
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    These Terms of Service are governed by and construed in
                    accordance with the laws of India.
                  </p>
                  <p>
                    Any disputes arising under or in connection with these Terms
                    shall be subject to the exclusive jurisdiction of the
                    competent courts located in the registered location of Eres,
                    India.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="section-13" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    13
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Contact Information
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    If you have questions, feedback, or notices regarding these
                    Terms, please contact our legal desk:
                  </p>
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-200/90 text-sm">
                    Email:{" "}
                    <a
                      href="mailto:support@waspai.in"
                      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/30 hover:decoration-purple-500 transition-colors font-semibold"
                    >
                      support@waspai.in
                    </a>
                  </div>
                </div>
              </section>
            </div>

            {/* Bottom Links */}
            <div className="h-px bg-white/5 my-12" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-start text-xs text-neutral-500">
              <Link
                href="/privacy"
                className="hover:text-neutral-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-neutral-300 transition-colors font-medium text-neutral-300"
              >
                Terms of Service
              </Link>
              <Link
                href="/refund"
                className="hover:text-neutral-300 transition-colors"
              >
                Cancellation & Refund
              </Link>
              <Link
                href="/shipping"
                className="hover:text-neutral-300 transition-colors"
              >
                Shipping & Delivery
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
