import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { parseInsightsQuery } from '../lib/insights-query-params';

/**
 * GET /insights/overview — headcount + per-currency total/average (FR-5.1).
 * The query key is the URL's own search-param string, so identical filter
 * URLs share a cache entry and any filter change refetches — the same
 * URL-as-cache-key convention `useEmployees` uses.
 */
export function useOverview(searchParams: URLSearchParams) {
  const searchParamsString = searchParams.toString();

  return useQuery({
    queryKey: ['insights', 'overview', searchParamsString],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/insights/overview', {
        params: { query: parseInsightsQuery(searchParams) },
      });
      if (error) throw error;
      return data;
    },
  });
}
