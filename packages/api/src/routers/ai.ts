import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic'
import { experimental_generateImage as generateImage, generateText } from 'ai';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { TRPCError } from '@trpc/server';
import OpenAI, { toFile } from "openai";
import { db, schema } from '@repo/database';
import { and, eq, or } from 'drizzle-orm';

const allProviders = {
  openai: openai,
  anthropic: anthropic,
  openrouter: createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  })
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      apiKey: z.string().optional(),
      system: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { prompt, provider, model, messages, system, apiKey } = input;

      let currentProvider;

      if (apiKey) {
        currentProvider = createOpenRouter({
          apiKey,
        })
      } else {
        currentProvider = allProviders[provider as keyof typeof allProviders];
      }

      const currentModel = currentProvider.chat(model);

      const { text } = await generateText({
        model: currentModel,
        prompt,
        messages,
        system,
      });

      return text;
    }),
  generateImage: protectedProcedure
    .input(z.object({
      messages: z.string(),
      conversationId: z.string(),
      size: z.number().optional(),
      n: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { n, messages } = input;
      const { userId } = ctx.auth;

      const conversation = await ctx.db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, input.conversationId),
            or(
              eq(schema.conversations.ownerId, ctx.auth.userId),
            )
          )
        )


      const model = openai.image('gpt-image-1');

      db.insert(schema.messages).values({
        content: messages && '',
        conversationId: input.conversationId,
        role: 'user',
      });

      const { images } = await generateImage({
        model,
        prompt: messages ?? '',
        n,
      });

      await db.insert(schema.messages).values({
        content: messages ?? '',
        role: 'assistant',
        conversationId: input.conversationId,
        // @ts-ignore
        images: images.map((image) => image.base64Data),
      });

      return images;
    }),

  editImage: protectedProcedure
    .input(z.object({
      imageFiles: z.array(z.string().base64()),
      size: z.number().optional(),
      prompt: z.string(),
      n: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { imageFiles, prompt, size, n } = input;

      if (!imageFiles || imageFiles.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No image provided',
        });
      }

      try {
        // Convert base64 image to a buffer
        const images = [];
        for (const imageFile of imageFiles) {
          const imageBuffer = Buffer.from(imageFile, 'base64');

          // Convert buffer to file using toFile
          const image = await toFile(imageBuffer, "image.png", { type: "image/png" });
          images.push(image);
        }

        const response = await client.images.edit({
          model: "gpt-image-1",
          image: images,
          prompt: prompt,
        });

        return response;
      } catch (error) {
        console.error("Error in image edit:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to edit image',
        })
      }

    })
});
