import { Metadata } from "next";
import FeaturesClientPage from "./features-client";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore the advanced workspace capabilities of Wasp AI: multi-model chat, visual workflows, autonomous tool-armed agents, and secure sandbox coding.",
};

export default function Page() {
  return <FeaturesClientPage />;
}
