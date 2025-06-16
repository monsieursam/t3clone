'use client';

import { api } from '@/trpc/client';
import { useChat } from '@ai-sdk/react';
import { useRouter } from 'next/navigation';

export default function Chat() {
  const router = useRouter();
  const { input, handleInputChange } = useChat();
  const { mutateAsync: createConversation } = api.conversations.create.useMutation();
  const { mutateAsync: addMessage } = api.messages.create.useMutation();

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;


    const data = await createConversation({
      title: input,
    })
    await addMessage({
      conversationId: data.id,
      role: 'user',
      content: input,
    })

    router.push(`/${data.id}`);
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <form onSubmit={handleChatSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Start a new conversation..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
