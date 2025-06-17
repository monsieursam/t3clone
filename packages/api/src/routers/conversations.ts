import { router, protectedProcedure } from '../trpc'
import { schema } from '@repo/database'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'

export const conversationsRouter = router({
  // Get all conversations for the current user
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const conversations = await ctx.db
        .select()
        .from(schema.conversations)
        .where(eq(schema.conversations.ownerId, ctx.auth.userId))
        .orderBy(desc(schema.conversations.updatedAt))
      return conversations
    }),

  // Get a single conversation by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, input.id),
            eq(schema.conversations.ownerId, ctx.auth.userId)
          )
        )
      return conversation[0]
    }),

  // Create a new conversation
  create: protectedProcedure
    .input(z.object({
      title: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { title } = input;

      const conversation = await ctx.db
        .insert(schema.conversations)
        .values({
          title: title || 'New Conversation',

          ownerId: ctx.auth.userId
        })
        .returning()
      return conversation[0]
    }),

  // Update a conversation
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db
        .update(schema.conversations)
        .set({ title: input.title })
        .where(
          and(
            eq(schema.conversations.id, input.id),
            eq(schema.conversations.ownerId, ctx.auth.userId)
          )
        )
        .returning()
      return conversation[0]
    }),

  // Delete a conversation
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, input.id),
            eq(schema.conversations.ownerId, ctx.auth.userId)
          )
        )
      return { success: true }
    })
})
