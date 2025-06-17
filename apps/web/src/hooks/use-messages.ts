import { api } from '@/trpc/client';

export function useMessages(conversationId: string) {
  const utils = api.useUtils();
  const query = api.messages.get.useQuery({ conversationId });

  const invalidateMessageQuery = () => {
    utils.messages.get.invalidate();
  }

  return {
    messages: query.data || [],
    invalidateMessageQuery,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
