import ChatBot from "@/components/chat-bot";
import { generateUUID } from "lib/utils";
import { getSession } from "auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  console.log("[DEBUG HOME] Getting session...");
  const session = await getSession();
  console.log("[DEBUG HOME] Session result:", session);

  if (!session) {
    console.log("[DEBUG HOME] No session found, redirecting to /sign-in");
    redirect("/sign-in");
  }

  console.log("[DEBUG HOME] Session found, rendering chat");
  const id = generateUUID();
  return <ChatBot initialMessages={[]} threadId={id} key={id} />;
}
