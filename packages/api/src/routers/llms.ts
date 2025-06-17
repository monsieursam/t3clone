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

  // Create a new LLM
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      provider: z.string(),
      pricing_input: z.string().optional(),
      pricing_output: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const llm = await ctx.db
        .insert(schema.llms)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
          provider: input.provider,
          pricing_input: input.pricing_input,
          pricing_output: input.pricing_output
        })
        .returning()
      return llm[0]
    }),

  // Update an LLM
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      provider: z.string().optional(),
      pricing_input: z.string().optional(),
      pricing_output: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input
      const llm = await ctx.db
        .update(schema.llms)
        .set(updateData)
        .where(eq(schema.llms.id, id))
        .returning()
      return llm[0]
    }),

  // Delete an LLM
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.llms)
        .where(eq(schema.llms.id, input.id))
      return { success: true }
    })
})
