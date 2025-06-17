import { db, schema } from '@repo/database';
import { openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import { streamText, generateText } from 'ai';
import { NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const allProviders = {
  openai: openai,
};
const { messages: messageTable } = schema

export async function POST(req: Request) {
  const { messages, system, provider, model, conversationId } = await req.json();
  const user = await auth();

  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentProvider = allProviders[provider as keyof typeof allProviders];

  if (!currentProvider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  const result = streamText({
    model: openai.responses('gpt-4o-mini'),
    messages,
    system,
    onFinish: async (completion) => {
      await db.insert(messageTable).values({
        conversationId,
        content: messages[messages.length - 1].content,
        role: 'user',
      });
      await db.insert(messageTable).values({
        conversationId,
        content: completion.text,
        role: 'assistant',
      });
    }
  },

  );

  return result.toDataStreamResponse();
}
