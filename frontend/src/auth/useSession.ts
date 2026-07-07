import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { tokenStore } from './token-store';

export const SESSION_QUERY_KEY = ['session'] as const;

/** GET /auth/me — the current user + organisation, only queried while a token exists. */
export function useSession() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/auth/me');
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: tokenStore.get() !== null,
    retry: false,
    staleTime: Infinity,
  });
}
