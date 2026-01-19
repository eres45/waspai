
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

// Add Razorpay type definition
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const plan = params.plan as string;
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"summary" | "processing" | "success">("summary");

  const PLAN_DETAILS = {
    pro: {
      name: "Pro Plan",
      price: "₹830/mo",
      features: ["Unlimited Tools", "Pro Models", "Priority Support"],
    },
    ultra: {
      name: "Ultra Plan",
      price: "₹2,660/mo",
      features: ["Everything in Pro", "Frontier Models", "Video & Voice Generation"],
    },
  };

  const currentPlan = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS];

  if (!currentPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
           <CardHeader>
             <CardTitle className="text-destructive">Invalid Plan</CardTitle>
             <CardDescription>The plan you selected does not exist.</CardDescription>
           </CardHeader>
           <CardFooter>
             <Button onClick={() => router.push("/subscription")}>Go Back</Button>
           </CardFooter>
        </Card>
      </div>
    );
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create Order
      const response = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, period: "monthly" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // 2. Initialize Razorpay
      const options = {
        key: data.keyId, // Key ID from server
        amount: data.amount,
        currency: data.currency,
        name: "Wasp AI Solutions",
        description: `Subscription for ${currentPlan.name}`,
        image: "https://waspai.in/logo.png", // Ensure this path exists or use a placeholder
        order_id: data.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          setStep("processing");
          try {
             const verifyResponse = await fetch("/api/razorpay/verify", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature,
               }),
             });

             const verifyData = await verifyResponse.json();

             if (verifyData.success) {
               setStep("success");
               toast.success("Payment successful! Welcome to Wasp AI.");
               setTimeout(() => router.push("/dashboard"), 3000);
             } else {
               toast.error("Payment verification failed. Please contact support.");
               setLoading(false);
               setStep("summary");
             }
          } catch (err) {
            console.error(err);
            toast.error("Error verifying payment");
            setLoading(false);
            setStep("summary");
          }
        },
        prefill: {
          name: "", // Can be pre-filled if we have user context
          email: "",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp1.open();
      
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{step === "success" ? "Success!" : "Checkout"}</CardTitle>
          <CardDescription>
            {step === "success" ? "Your subscription is active." : `Complete your purchase for ${currentPlan.name}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === "summary" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium text-lg">{currentPlan.name} (Monthly)</span>
                <span className="font-bold text-xl">{currentPlan.price}</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-2">
                {currentPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying payment...</p>
            </div>
          )}

          {step === "success" && (
             <div className="flex flex-col items-center justify-center py-8 space-y-4">
               <CheckCircle2 className="w-16 h-16 text-green-500" />
               <p className="text-center text-muted-foreground">Redirecting you to dashboard...</p>
             </div>
          )}
        </CardContent>

        <CardFooter>
          {step === "summary" && (
            <Button 
              className="w-full text-lg py-6" 
              onClick={handlePayment} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                </>
              ) : (
                `Pay ${currentPlan.price}`
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
