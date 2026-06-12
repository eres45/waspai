import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Wasp AI",
  description:
    "Shipping and Delivery Policy for WASPAI. Information about our digital product delivery.",
};

const TOC = [
  { id: "section-1", title: "1. Digital-Only Service" },
  { id: "section-2", title: "2. Instant Delivery" },
  { id: "section-3", title: "3. What You Receive" },
  { id: "section-4", title: "4. Delivery Confirmation" },
  { id: "section-5", title: "5. Delivery Failures & Resolution" },
  { id: "section-6", title: "6. Payment Processing" },
  { id: "section-7", title: "7. Service Availability & Status" },
  { id: "section-8", title: "8. Contact Us" },
];

export default function ShippingPage() {
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
              Shipping & Delivery Policy
            </h1>
            <p className="text-lg text-neutral-400 font-light mb-10 leading-relaxed">
              Read how our digital SaaS accounts are delivered, transaction
              processing procedures, and how system statuses are checked.
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
                    Digital-Only Service
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Wasp AI is a purely cloud-hosted Software-as-a-Service
                    (SaaS) application. We manufacture and sell no physical
                    inventory, hardware items, or tangible goods.
                  </p>
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-blue-200/90 text-sm">
                    <strong>Note:</strong> There are no physical shipping
                    addresses required, no courier partners, and no freight
                    delivery charges associated with any of our services.
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section id="section-2" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    02
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Instant Delivery
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Access to Wasp AI plans is granted{" "}
                    <strong className="text-white">instantly</strong> upon
                    successful payment verification.
                  </p>
                  <p>
                    Once our payment partner (Razorpay) confirms the
                    transaction, your active limits (message credits, tool
                    triggers, workflow configurations) are automatically updated
                    in our databases and immediately visible on your user
                    interface.
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
                    What You Receive
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Upon tier upgrade delivery, the following features are
                    instantly unlocked on your account:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Uncapped access to premium model suites (including GPT-4o,
                      Claude 3.5 Sonnet, Gemini 2.5 Pro, and Grok).
                    </li>
                    <li>
                      Higher concurrent agent definitions and larger short/long
                      term context memories.
                    </li>
                    <li>
                      Ability to create and run multi-node automated workflows
                      on the canvas editor.
                    </li>
                    <li>
                      Extended limits for web search, image generations, file
                      storage, and sandbox code executions.
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
                    Delivery Confirmation
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Once your subscription is successfully delivered, you will
                    receive:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      An automated transaction invoice email containing the
                      payment ID from Razorpay.
                    </li>
                    <li>
                      An account status change notification inside the Wasp AI
                      system.
                    </li>
                    <li>
                      An updated billing status under{" "}
                      <span className="text-white">
                        Settings &gt; Subscription
                      </span>
                      .
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section id="section-5" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    05
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Delivery Failures & Resolution
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    On rare occasions, network latency between payment gateways
                    and our databases may cause a slight delay in account
                    unlocking.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      If your features do not unlock within{" "}
                      <strong className="text-white">15 minutes</strong> of
                      transaction completion, please clear your browser cache,
                      log out, and log back in.
                    </li>
                    <li>
                      If the status remains unchanged, email us at{" "}
                      <a
                        href="mailto:support@waspai.in"
                        className="text-purple-400 hover:underline"
                      >
                        support@waspai.in
                      </a>{" "}
                      with your payment transaction ID. Our tech support desk
                      will manually inspect and unlock your account immediately.
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
                    Payment Gateway Security
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    All payment processing for subscription activation is
                    handled by <strong className="text-white">Razorpay</strong>.
                  </p>
                  <p>
                    Razorpay uses state-of-the-art PCI DSS security standards to
                    encrypt and authorize your transactions. Wasp AI does not
                    store, process, or have direct access to your raw payment
                    card credentials.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="section-7" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    07
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Service Uptime & Availability
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    We aim to deliver 99.9% uptime for Wasp AI. However,
                    scheduled maintenance, system optimizations, or AI API
                    provider outages can occur.
                  </p>
                  <p>
                    Major scheduled downtime is always announced on the Wasp AI
                    dashboard at least 24 hours in advance.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section id="section-8" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    08
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Contact Us
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    If you have questions about payment delivery status or have
                    issues accessing premium features, please contact us:
                  </p>
                  <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-200/90 text-sm">
                    Email:{" "}
                    <a
                      href="mailto:support@waspai.in"
                      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/30 hover:decoration-purple-500 transition-colors font-semibold font-mono"
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
                className="hover:text-neutral-300 transition-colors font-medium text-neutral-300"
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
