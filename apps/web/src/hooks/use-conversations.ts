import { api } from '@/trpc/client';

export function useConversations() {
  const utils = api.useUtils();

  // Query for fetching all conversations
  const query = api.conversations.getAll.useQuery();

  // Mutation for creating a new conversation
  const createMutation = api.conversations.create.useMutation({
    onSuccess: () => {
      utils.conversations.getAll.invalidate();
    },
  });

  const updateMutation = api.conversations.update.useMutation({
    onSuccess: () => {
      utils.conversations.getAll.invalidate();
    },
  });

  const deleteMutation = api.conversations.delete.useMutation({
    onSuccess: () => {
      utils.conversations.getAll.invalidate();
    },
  });

  return {
    conversations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createConversationData: createMutation.data,
    createConversation: createMutation.mutateAsync,
    updateConversation: updateMutation.mutate,
    deleteConversation: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCreating: createMutation.isPending,
  };
}
