
import ChatInterface from './_components/chat-interface';
import { caller } from '@/trpc/server';

export default async function Chat() {
  const llms = await caller.llms.getAll();

  return <ChatInterface llms={llms} />
}
