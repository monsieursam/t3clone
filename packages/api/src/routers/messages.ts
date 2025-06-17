import { router, protectedProcedure } from '../trpc'
import { schema } from '@repo/database'
import { z } from 'zod'
import { eq, and, desc, or, inArray, arrayContains, asc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const messagesRouter = router({
  // Get all messages for a conversation
  get: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, input.conversationId),
            or(
              eq(schema.conversations.ownerId, ctx.auth.userId),
              arrayContains(schema.conversations.participantsIds, [ctx.auth.userId])
            )
          )
        )

      if (!conversation[0]) {
        throw new TRPCError(
          {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        )
      }

      const messages = await ctx.db
        .select()
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.conversationId, input.conversationId),
          )
        )
        .orderBy(asc(schema.messages.createdAt))

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
