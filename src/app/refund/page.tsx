import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Wasp AI",
  description: "Cancellation and Refund Policy for Wasp AI Solutions.",
};

export default function RefundPage() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      <h1 className="text-4xl font-bold mb-8">Cancellation & Refund Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Cancellation Policy</h2>
          <p>
            You may cancel your subscription at any time via your Account Settings or by contacting support.
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Cancellation Effect:</strong> Your subscription will remain active until the end of the current billing cycle. After that, you will not be charged again, and your account will revert to the Free tier.</li>
            <li><strong>How to Cancel:</strong> Go to Settings &gt; Subscription &gt; Manage Subscription, or email <a href="mailto:support@waspai.in" className="text-primary hover:underline">support@waspai.in</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Refund Policy</h2>
          <p>
            Due to the nature of digital AI services (where computing costs are incurred immediately upon usage), we generally <strong>do not offer refunds</strong> for:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
             <li>Partial months of service.</li>
             <li>"Accidental" purchases where the service was used.</li>
             <li>Change of mind after extensive usage.</li>
          </ul>
          <p className="mt-4">
            <strong>Exceptions:</strong> We review refund requests on a case-by-case basis. If you believe you were charged in error or faced technical issues preventing you from using the service, please contact us within 7 days of the charge.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Contact Us</h2>
          <p>
            For any billing-related questions, please contact our billing support at <a href="mailto:support@waspai.in" className="text-primary hover:underline">support@waspai.in</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
