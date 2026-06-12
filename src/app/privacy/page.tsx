import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Wasp AI",
  description:
    "Privacy Policy for WASPAI. Learn how we collect, use, and protect your data.",
};

const TOC = [
  { id: "section-1", title: "1. Introduction" },
  { id: "section-2", title: "2. Information We Collect" },
  { id: "section-3", title: "3. How We Use Information" },
  { id: "section-4", title: "4. AI Interactions & Data" },
  { id: "section-5", title: "5. Cookies & Tracking" },
  { id: "section-6", title: "6. Data Sharing" },
  { id: "section-7", title: "7. Data Retention" },
  { id: "section-8", title: "8. Your Rights" },
  { id: "section-9", title: "9. Children's Privacy" },
  { id: "section-10", title: "10. Policy Changes" },
  { id: "section-11", title: "11. Contact Us" },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-lg text-neutral-400 font-light mb-10 leading-relaxed">
              At Wasp AI, we respect your privacy and are committed to
              protecting your personal data. This privacy policy explains how we
              collect, process, and protect your information when you visit
              waspai.in.
            </p>

            <div className="h-px bg-white/5 mb-10" />

            {/* Policy Sections */}
            <div className="space-y-12">
              {/* Section 1 */}
              <section id="section-1" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    01
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Introduction
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Welcome to <strong>WASPAI</strong> (waspai.in)
                    (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), which
                    is owned and operated by <strong>Eres</strong>. We are
                    committed to safeguarding your personal data and respecting
                    your privacy rights.
                  </p>
                  <p>
                    This Privacy Policy outlines how we collect, process, use,
                    store, and share your personal information when you use our
                    website, application, custom AI agents, automated workflows,
                    and multi-model AI interface. By using our platform, you
                    acknowledge and agree to the collection and use of
                    information in accordance with this policy.
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
                    Information We Collect
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    We collect several types of information to provide and
                    improve our services to you:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">Identity Data:</strong>{" "}
                      Includes your full name, username, social auth IDs, or
                      similar identifiers provided during registration.
                    </li>
                    <li>
                      <strong className="text-white">Contact Data:</strong>{" "}
                      Includes your primary email address and email
                      communications.
                    </li>
                    <li>
                      <strong className="text-white">Technical Data:</strong>{" "}
                      Includes internet protocol (IP) address, login sessions,
                      browser type and version, time zone setting, browser
                      plug-ins, operating system, device details, and network
                      configurations.
                    </li>
                    <li>
                      <strong className="text-white">Usage Data:</strong>{" "}
                      Information about how you interact with our website,
                      specific models queried, tools used, canvas/workflow
                      execution logs, session length, and interface preferences.
                    </li>
                  </ul>
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-blue-200/90 text-sm">
                    <strong>Payment Data:</strong> All financial transactions,
                    subscriptions, and billing operations are securely handled
                    and processed via{" "}
                    <strong className="text-white">Razorpay</strong>. Wasp AI
                    never accesses, stores, or processes your credit card
                    numbers, CVVs, or UPI PINs.
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="section-3" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    03
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    How We Use Your Information
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    We process your personal information for the following
                    purposes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      To authenticate your identity and administer your account.
                    </li>
                    <li>
                      To deliver core AI Chat services, customize agent
                      configurations, and execute custom workflows.
                    </li>
                    <li>
                      To process subscriptions, track payments, and verify
                      limits (via Razorpay).
                    </li>
                    <li>
                      To analyze system usage, monitor rate limits, and optimize
                      performance across our multi-model nodes.
                    </li>
                    <li>
                      To detect, prevent, and address security threats, fraud,
                      or violations of our Terms of Service.
                    </li>
                    <li>
                      To comply with statutory legal requirements and
                      governmental requests.
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
                    AI Interactions & Data Processing
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Our platform acts as a unified gateway to multiple AI model
                    providers (including OpenAI, Anthropic, Google, xAI,
                    DeepSeek, and others).
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">Prompt Delivery:</strong>{" "}
                      When you send message prompts or upload files, they are
                      securely transmitted to the selected third-party AI
                      provider to generate responses.
                    </li>
                    <li>
                      <strong className="text-white">No Model Training:</strong>{" "}
                      We do not train, nor do we permit third-party providers to
                      train, their generic foundational models on your private
                      prompt inputs or responses.
                    </li>
                    <li>
                      <strong className="text-white">
                        Conversation History:
                      </strong>{" "}
                      We store your chat history solely for session continuity,
                      workflow execution, and interface retrieval. You can
                      delete individual chats or purge history at any time.
                    </li>
                  </ul>
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-sm">
                    <strong>Caution:</strong> Do not post highly confidential,
                    proprietary, or regulated personal information (such as
                    health records or raw bank databases) directly into generic
                    chat prompts.
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
                    Cookies & Tracking Technologies
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Wasp AI utilizes essential cookies and session tokens to
                    keep you logged in and preserve your settings (such as theme
                    choice and selected models).
                  </p>
                  <p>
                    We do not use tracking pixels, behavioral advertising
                    cookies, or intrusive third-party analytical cookies that
                    follow you across the web. Any performance analytics we run
                    are self-hosted or strictly aggregated and anonymized.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section id="section-6" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    06
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Data Sharing & Third Parties
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    We value your trust and never sell your personal data. We
                    only share information with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">
                        AI Model Providers:
                      </strong>{" "}
                      Pass through of anonymized prompts and data required for
                      model inference.
                    </li>
                    <li>
                      <strong className="text-white">
                        Payment Processor (Razorpay):
                      </strong>{" "}
                      Transaction details required for billing, subscription
                      updates, and fraud prevention.
                    </li>
                    <li>
                      <strong className="text-white">
                        Infrastructure Providers:
                      </strong>{" "}
                      Encrypted hosting providers (such as Vercel and Supabase)
                      that run our core databases and servers.
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
                    Data Retention Policy
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    We keep your account data active for as long as your account
                    is maintained. Upon request to delete your account:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Your profile information, prompt history, and custom
                      workflows will be permanently deleted or anonymized within
                      90 days.
                    </li>
                    <li>
                      Payment logs, subscription records, and invoice details
                      will be retained for up to 7 years in compliance with
                      statutory audit and taxation laws in India.
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
                    Your Rights & Control
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Depending on your location, you hold the following rights
                    regarding your data:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      The right to request access to and a copy of your personal
                      data.
                    </li>
                    <li>The right to request correction of inaccurate data.</li>
                    <li>
                      The right to request erasure of your data (&quot;Right to
                      be Forgotten&quot;).
                    </li>
                    <li>
                      The right to object to or restrict processing under
                      certain conditions.
                    </li>
                  </ul>
                  <p>
                    To exercise any of these rights, please email us at{" "}
                    <a
                      href="mailto:support@waspai.in"
                      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/30 hover:decoration-purple-500 transition-colors"
                    >
                      support@waspai.in
                    </a>
                    . We will respond to your request within 30 days.
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
                    Children&apos;s Privacy
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Our services are not intended for children under the age of
                    13. We do not knowingly collect personal data from anyone
                    under 13. If you become aware that a child has provided us
                    with personal data without parental consent, please contact
                    us immediately, and we will take immediate steps to remove
                    the information and terminate the account.
                  </p>
                </div>
              </section>

              {/* Section 10 */}
              <section id="section-10" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    10
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Changes to This Policy
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    We may update our Privacy Policy from time to time to
                    reflect modifications in our features, service architecture,
                    or legal landscape.
                  </p>
                  <p>
                    We will notify you of any material changes by posting the
                    new policy on this page and updating the &quot;Last
                    Updated&quot; date at the top. For major changes, we will
                    send an email notification to registered users.
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
                    Contact Us
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    If you have any questions, comments, or concerns regarding
                    this Privacy Policy or our data practices, please reach out
                    to us:
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
                className="hover:text-neutral-300 transition-colors font-medium text-neutral-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-neutral-300 transition-colors"
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
