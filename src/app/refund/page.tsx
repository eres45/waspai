import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Wasp AI",
  description:
    "Cancellation and Refund Policy for Wasp AI. Read about our billing and refund guidelines.",
};

const TOC = [
  { id: "section-1", title: "1. Overview" },
  { id: "section-2", title: "2. Subscription Cancellation" },
  { id: "section-3", title: "3. What We Do Not Refund" },
  { id: "section-4", title: "4. Eligible Refund Cases" },
  { id: "section-5", title: "5. How to Request a Refund" },
  { id: "section-6", title: "6. Refund Processing" },
  { id: "section-7", title: "7. Subscription Downgrades" },
  { id: "section-8", title: "8. Contact Us" },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white selection:bg-purple-500/30 selection:text-white font-sans antialiased">
      {/* Top Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/wasp-ai-logo.png"
              alt="Wasp AI Logo"
              width={32}
              height={32}
              className="rounded-md shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">
              Wasp AI
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
              Cancellation & Refund Policy
            </h1>
            <p className="text-lg text-neutral-400 font-light mb-10 leading-relaxed">
              Understand our billing procedures, how subscription cancellations
              affect your billing cycle, and our refund guidelines for digital
              products.
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
                    Overview
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Wasp AI provides digital Software-as-a-Service (SaaS)
                    products. Unlike physical inventory, the provision of
                    multi-model inference, image/video generations, and
                    background execution agents incurs immediate server,
                    hosting, and API costs when actions are performed.
                  </p>
                  <p>
                    Consequently, our cancellation and refund policies are
                    designed to accommodate these computational realities while
                    remaining fair to our subscribers.
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
                    Subscription Cancellation
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    You can cancel your active subscription (Pro or Ultra) at
                    any time.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">How to Cancel:</strong>{" "}
                      Navigate to{" "}
                      <span className="text-white">
                        Settings &gt; Subscription &gt; Manage Subscription
                      </span>{" "}
                      within your dashboard. Alternatively, you can email us at{" "}
                      <a
                        href="mailto:support@waspai.in"
                        className="text-purple-400 hover:underline"
                      >
                        support@waspai.in
                      </a>{" "}
                      requesting cancellation.
                    </li>
                    <li>
                      <strong className="text-white">
                        Cancellation Effect:
                      </strong>{" "}
                      Upon cancellation, your premium features remain active
                      until the end of your current billing period. Once the
                      billing cycle concludes, your account reverts to the Free
                      tier and you will not be charged again.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section id="section-3" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white/5 border border-white/10 rounded text-neutral-400">
                    03
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    What We Do Not Refund
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>As a rule, Eres does not issue refunds for:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Unused quotas, message credits, or workflow nodes
                      remaining at the end of a billing period.
                    </li>
                    <li>
                      Accidental purchases or renewal charges where the service
                      features have been actively used.
                    </li>
                    <li>Partial months or prorated billing periods.</li>
                    <li>
                      Subscribers whose accounts are terminated or suspended due
                      to violations of our Terms of Service (Acceptable Use
                      policy).
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
                    Eligible Refund Cases
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    Refunds are reviewed and approved on a case-by-case basis.
                    You may be eligible for a refund under the following
                    conditions:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong className="text-white">System Error:</strong>{" "}
                      Duplicate charges or billing errors caused directly by our
                      system or the payment integration.
                    </li>
                    <li>
                      <strong className="text-white">Service Outage:</strong>{" "}
                      Severe technical failures on our side preventing access to
                      your dashboard/models for more than 48 consecutive hours.
                    </li>
                    <li>
                      <strong className="text-white">
                        Accidental Auto-Renewal:
                      </strong>{" "}
                      If you did not intend to renew, you must submit a refund
                      request within 48 hours of the renewal charge, provided
                      you have not logged in or queried any AI models since the
                      charge.
                    </li>
                  </ul>
                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-sm">
                    <strong>Timeframe:</strong> Refund claims must be submitted
                    within 7 days of the transaction date. Requests made after 7
                    days will not be considered.
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
                    How to Request a Refund
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    To request a refund, email our support team at{" "}
                    <a
                      href="mailto:support@waspai.in"
                      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/30 hover:decoration-purple-500 transition-colors"
                    >
                      support@waspai.in
                    </a>
                    . Your email must include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      The registered email address of your Wasp AI account.
                    </li>
                    <li>The Order/Payment ID generated by Razorpay.</li>
                    <li>The date and amount of the transaction.</li>
                    <li>
                      A clear explanation of why you are requesting a refund,
                      including screenshots of any errors if applicable.
                    </li>
                  </ul>
                  <p>
                    Our billing team will acknowledge and review your request
                    within 3 business days.
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
                    Refund Processing
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>Once a refund is approved by our billing team:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      The refund transaction is immediately initiated via our
                      payment gateway (
                      <strong className="text-white">Razorpay</strong>).
                    </li>
                    <li>
                      The refunded amount is credited back to the original
                      payment method (bank account, credit/debit card, or UPI
                      wallet).
                    </li>
                    <li>
                      The funds typically reflect in your account within{" "}
                      <strong className="text-white">
                        5 to 10 business days
                      </strong>
                      , depending on your bank&apos;s processing timeline.
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
                    Subscription Downgrades
                  </h2>
                </div>
                <div className="text-neutral-400 leading-relaxed space-y-4">
                  <p>
                    If you choose to downgrade from the Ultra tier to the Pro
                    tier in the middle of a billing cycle:
                  </p>
                  <p>
                    You will retain access to the Ultra tier features until the
                    end of your current cycle. At the start of the next billing
                    cycle, you will be billed the lower rate for the Pro tier,
                    and your limits will adjust accordingly. Downgrades
                    mid-cycle do not entitle you to a refund or credit for the
                    price difference.
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
                    For all billing questions, transaction failures, or refund
                    inquiries, please email us directly:
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
                className="hover:text-neutral-300 transition-colors font-medium text-neutral-300"
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
