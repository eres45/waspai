import { Metadata } from "next";
import AiAgentsClientPage from "./ai-agents-client";

export const metadata: Metadata = {
  title: "AI Agents",
  description:
    "Deploy autonomous, tool-armed AI assistants to handle complex operations. Customize model behaviors and grant sandbox code execution power on Wasp AI.",
};

export default function Page() {
  return <AiAgentsClientPage />;
}
