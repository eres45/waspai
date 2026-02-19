import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Wasp AI",
  description: "Contact Wasp AI Solutions support.",
};

export default function ContactPage() {
  return (
    <div className="container max-w-4xl py-12 px-4 mx-auto">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

      <div className="bg-muted/30 p-8 rounded-lg border">
        <p className="text-lg mb-6">
          We are here to help. If you have any questions, concerns, or feedback
          regarding Wasp AI, please reach out to us.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-xl mb-1">Email Support</h3>
            <p className="text-muted-foreground">
              For general inquiries and technical support:
              <br />
              <a
                href="mailto:support@waspai.in"
                className="text-primary hover:underline"
              >
                support@waspai.in
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xl mb-1">Business Address</h3>
            <p className="text-muted-foreground">
              Wasp AI Solutions
              <br />
              Digital HQ, India.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-xl mb-1">Response Time</h3>
            <p className="text-muted-foreground">
              We aim to respond to all inquiries within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
