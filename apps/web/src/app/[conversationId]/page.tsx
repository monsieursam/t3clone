'use client';

import { api } from '@/trpc/client';
import { useChat } from '@ai-sdk/react';
import { useParams } from 'next/navigation';

export default function ConversationPage() {
  const params = useParams();
  const { data } = api.messages.get.useQuery({
    conversationId: params.conversationId as string,
  });
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    initialMessages: data?.map((message) => {
      return {
        id: message.id,
        role: message.role,
        content: message.content,
      }
    }) ?? [],
    id: params.conversationId as string,
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Continue the conversation..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
