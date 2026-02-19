import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Wasp AI",
  description:
    "Privacy Policy for Wasp AI Solutions. Last updated January 2026.",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last Updated: January 17, 2026
      </p>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to <strong>Wasp AI Solutions</strong> (&quot;we,&quot;
            &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are
            committed to protecting your personal data. This privacy policy will
            inform you as to how we look after your personal data when you visit
            our website (waspai.in) and use our AI services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
          <p>
            We may collect, use, store, and transfer different kinds of personal
            data about you which we have grouped together follows:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong>Identity Data:</strong> includes name, username, or
              similar identifier.
            </li>
            <li>
              <strong>Contact Data:</strong> includes email address.
            </li>
            <li>
              <strong>Technical Data:</strong> includes internet protocol (IP)
              address, browser type and version, time zone setting and location,
              browser plug-in types and versions, operating system and platform.
            </li>
            <li>
              <strong>Usage Data:</strong> includes information about how you
              use our website and AI models.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            3. How We Use Your Data
          </h2>
          <p>
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your personal data in the following
            circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>To register you as a new customer.</li>
            <li>
              To provide and improve our AI services (Chat, Image Generation,
              etc.).
            </li>
            <li>To manage our relationship with you.</li>
            <li>
              To improve our website, products/services, marketing, and customer
              relationships.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your
            personal data from being accidentally lost, used or accessed in an
            unauthorized way, altered, or disclosed. In addition, we limit
            access to your personal data to those employees, agents,
            contractors, and other third parties who have a business need to
            know.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            5. Third-Party Services
          </h2>
          <p>
            Our service integrates with third-party AI providers (such as
            OpenAI, Anthropic, Google, DeepSeek). When you interact with these
            models, anonymized prompts may be processed by these providers to
            generate responses. We ensure these partners adhere to strict data
            protection standards.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy
            practices, please contact us at:{" "}
            <a
              href="mailto:support@waspai.in"
              className="text-primary hover:underline"
            >
              support@waspai.in
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
