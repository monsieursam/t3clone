import { router, protectedProcedure } from '../trpc'

export const protectedRouter = router({
  hello: protectedProcedure.query(({ ctx }) => {
    const { userId } = ctx.auth

    return {
      secret: `${userId} is using a protected procedure`,
    }
  }),
})
