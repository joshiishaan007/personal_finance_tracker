import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      // Match the offline-snapshot maxAge (3 days) so restored queries aren't
      // garbage-collected from memory before the persister can rehydrate them.
      gcTime: 1000 * 60 * 60 * 24 * 3,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err) => {
        console.error('Mutation error:', err);
      },
    },
  },
});
