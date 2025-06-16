import { auth } from '@clerk/nextjs/server'
import { db } from '@repo/database'

export const createContext = async () => {
  return {
    auth: await auth(),
    db: db
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
