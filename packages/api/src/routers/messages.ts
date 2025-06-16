import { router, protectedProcedure } from '../trpc'
import { schema } from '@repo/database'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'

export const messagesRouter = router({
  // Get all messages for a conversation
  get: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.conversationId, input.conversationId),
            eq(schema.messages.userId, ctx.auth.userId)
          )
        )
        .orderBy(desc(schema.messages.createdAt))
      return messages
    }),

  // Create a new message
  create: protectedProcedure
    .input(z.object({
      content: z.string(),
      conversationId: z.string().uuid(),
      role: z.enum(['user', 'assistant', 'system', 'data']),
      llmId: z.string().uuid().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db
        .insert(schema.messages)
        .values({
          content: input.content,
          conversationId: input.conversationId,
          userId: ctx.auth.userId,
          role: input.role,
          llmId: input.llmId
        })
        .returning()
      return message[0]
    }),

  // Update a message
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      content: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db
        .update(schema.messages)
        .set({ content: input.content })
        .where(
          and(
            eq(schema.messages.id, input.id),
            eq(schema.messages.userId, ctx.auth.userId)
          )
        )
        .returning()
      return message[0]
    }),

  // Delete a message
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.messages)
        .where(
          and(
            eq(schema.messages.id, input.id),
            eq(schema.messages.userId, ctx.auth.userId)
          )
        )
      return { success: true }
    })
})
