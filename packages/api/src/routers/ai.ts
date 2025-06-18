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
      messages: z.array(z.object
        ({
          role: z.enum(['user', 'assistant', 'data', 'system']),
          content: z.string(),
        })),
      conversationId: z.string(),
      size: z.number().optional(),
      n: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { n, messages } = input;

      const prompt = messages.map(item => item.content).join('');

      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

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
        );

      const data = await db.insert(schema.messages).values({
        content: prompt || '',
        conversationId: input.conversationId,
        userId: ctx.auth.userId,
        role: 'user',
      });

      const response = await client.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
      });

      const image = response?.data?.[0]?.b64_json;
      const formattedImage = `data:image/png;base64,${image}`

      const redata = await db.insert(schema.messages).values({
        images: [formattedImage || ''],
        content: '',
        conversationId: input.conversationId,
        userId: ctx.auth.userId,
        role: 'assistant',
      });

      return formattedImage;
    }),

  editImage: protectedProcedure
    .input(z.object({
      imageFiles: z.array(z.string().base64()),
      size: z.number().optional(),
      prompt: z.string(),
      n: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const { imageFiles, prompt, size, n } = input;

      if (!imageFiles || imageFiles.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No image provided',
        });
      }

      try {
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
