"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateUUID } from "lib/utils";

export default function ChatPage() {
  const router = useRouter();
  // Use a ref to ensure we only navigate once regardless of re-renders.
  // `router` is not referentially stable in Next.js — it changes on every
  // render, so `useEffect([router])` would fire again and generate a second
  // UUID causing the visible double-reload the user reports.
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace(`/chat/${generateUUID()}`);
  }, [router]);

  return null;
}
