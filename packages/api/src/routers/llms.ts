import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc'
import { schema } from '@repo/database'
import { eq, desc } from 'drizzle-orm'

export const llmRouter = router({
  // Get all LLMs
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      const llms = await ctx.db
        .select()
        .from(schema.llms)
        .orderBy(desc(schema.llms.updatedAt))
      return llms
    }),

  // Get a single LLM by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const llm = await ctx.db
        .select()
        .from(schema.llms)
        .where(eq(schema.llms.id, input.id))
      return llm[0]
    }),
})
