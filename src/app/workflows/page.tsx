import { Metadata } from "next";
import WorkflowsClientPage from "./workflows-client";

export const metadata: Metadata = {
  title: "Workflows",
  description:
    "Design visual automated pipelines, chain foundational LLMs (Claude, GPT, Gemini), and orchestrate multi-model executions with Wasp AI.",
};

export default function Page() {
  return <WorkflowsClientPage />;
}
