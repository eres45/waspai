import { Metadata } from "next";
import StatusPageClient from "./client";

export const metadata: Metadata = {
  title: "System Status | WaspAI",
  description: "Real-time status and uptime monitoring for all WaspAI models",
};

export default function StatusPage() {
  return <StatusPageClient />;
}
