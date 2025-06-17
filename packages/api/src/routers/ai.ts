import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic'
import { experimental_generateImage as generateImage, generateText } from 'ai';
import { protectedProcedure, publicProcedure, router } from '../trpc';

const allProviders = {
  openai: openai,
  anthropic: anthropic,
};

export const aiRouter = router({
  generateText: protectedProcedure
    .input(z.object({
      prompt: z.string().optional(),
      provider: z.string(),
      model: z.string(),
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })),
      system: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { prompt, provider, model, messages, system } = input;
      const currentProvider = allProviders[provider as keyof typeof allProviders];

      const currentModel = currentProvider(model);

      const { text } = await generateText({
        model: currentModel,
        prompt,
        messages,
        system,
      });

      return text;
    }),
});
