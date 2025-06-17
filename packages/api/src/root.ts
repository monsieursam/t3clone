import { router } from './trpc';
import { exampleRouter } from './routers/example';
import { conversationsRouter } from './routers/conversations';
import { messagesRouter } from './routers/messages';
import { aiRouter } from './routers/ai';
import { llmRouter } from './routers/llms';

export const appRouter = router({
  example: exampleRouter,
  conversations: conversationsRouter,
  messages: messagesRouter,
  ai: aiRouter,
  llms: llmRouter
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
