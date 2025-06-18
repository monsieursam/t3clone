import { db, schema } from '@repo/database';
import { openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import { streamText, generateText } from 'ai';
import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const allProviders = {
  openai: openai,
  anthropic: anthropic,
  openrouter: createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  }),
};
const { messages: messageTable } = schema

export async function POST(req: Request) {
  const { messages, system, provider, model, conversationId, llmId, apiKey } = await req.json();
  const user = await auth();

  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let currentProvider;

  if (apiKey && provider === 'openrouter') {
    const openrouter = createOpenRouter({
      apiKey,
    });

    currentProvider = openrouter;
  } else {
    currentProvider = allProviders[provider as keyof typeof allProviders];
  }

  const currentModel = currentProvider.chat(model);

  if (!currentProvider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  if (!currentModel) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  }

  const result = streamText({
    model: currentModel,
    messages,
    system,
    onFinish: async (completion) => {
      // Make a request to get current id LLM in the database
      await db.insert(messageTable).values({
        conversationId,
        content: messages[messages.length - 1].content,
        role: 'user',
        userId: user.userId,
        llmId,
      });
      await db.insert(messageTable).values({
        conversationId,
        content: completion.text,
        role: 'assistant',
        userId: user.userId,
        llmId,
      });
    }
  },

  );

  return result.toDataStreamResponse();
}
