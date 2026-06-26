"use client";

import { useEffect } from "react";

export function ReferralInitializer() {
  useEffect(() => {
    // Attempt to apply pending referral code from cookies
    fetch("/api/referral/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("[Referral] Successfully applied pending referral");
        }
      })
      .catch((err) => {
        console.error("[Referral] Failed to apply pending referral:", err);
      });
  }, []);

  return null;
}
