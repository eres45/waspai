import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Wasp AI",
  description: "Shipping and Delivery Policy for Wasp AI Solutions.",
};

export default function ShippingPage() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      <h1 className="text-4xl font-bold mb-8">Shipping & Delivery Policy</h1>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            1. Digital Nature of Goods
          </h2>
          <p>
            Wasp AI Solutions provides purely digital software-as-a-service
            (SaaS) products. <strong>We do not sell physical goods</strong>, and
            therefore, no physical shipping is involved.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Immediate Delivery</h2>
          <p>Upon successful payment for a subscription or credit pack:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              Service access is granted <strong>instantly</strong>.
            </li>
            <li>
              You will receive a confirmation email with your transaction
              details.
            </li>
            <li>
              The paid features (e.g., Pro Models, Image Generation) become
              available in your account immediately.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Issues with Access</h2>
          <p>
            If you have completed a payment but do not have access to the
            premium features, please contact us immediately at{" "}
            <a
              href="mailto:support@waspai.in"
              className="text-primary hover:underline"
            >
              support@waspai.in
            </a>{" "}
            with your transaction ID. We will resolve the issue within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
