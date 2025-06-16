import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage, generateText } from 'ai';
import { publicProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';

export const aiRouter = router({
  generateText: publicProcedure
    .input(z.object({
      prompt: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { prompt } = input;
      const model = openai('gpt-3.5-turbo');

      const { text } = await generateText({
        model,
        prompt,
      });

      return text;
    }),
});
