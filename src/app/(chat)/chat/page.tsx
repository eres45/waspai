import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  console.log("[DEBUG CHAT] Getting session...");
  const session = await getSession();
  console.log("[DEBUG CHAT] Session result:", session);

  if (!session) {
    console.log("[DEBUG CHAT] No session found, redirecting to /sign-in");
    redirect("/sign-in");
  }

  console.log("[DEBUG CHAT] Session found, rendering chat");
  const id = generateUUID();
  return <ChatBot initialMessages={[]} threadId={id} key={id} />;
}
