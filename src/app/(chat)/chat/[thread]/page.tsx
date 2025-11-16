import { selectThreadWithMessagesAction } from "@/app/api/chat/actions";
import ChatBot from "@/components/chat-bot";

import { ChatMessage, ChatThread } from "app-types/chat";

const fetchThread = async (
  threadId: string,
): Promise<(ChatThread & { messages: ChatMessage[] }) | null> => {
  return await selectThreadWithMessagesAction(threadId);
};

export default async function Page({
  params,
}: { params: Promise<{ thread: string }> }) {
  const { thread: threadId } = await params;

  const thread = await fetchThread(threadId);

  // If thread doesn't exist yet, it will be created when the first message is sent
  // This allows new threads to be created with AI style mentions
  const initialMessages = thread?.messages ?? [];

  return <ChatBot threadId={threadId} initialMessages={initialMessages} />;
}
