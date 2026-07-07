import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { parseInsightsQuery } from '../lib/insights-query-params';

/**
 * GET /insights/by-country — per-country, per-currency breakdown (FR-5.2).
 * Same URL-as-cache-key convention as `useOverview`.
 */
export function useCountryBreakdown(searchParams: URLSearchParams) {
  const searchParamsString = searchParams.toString();

  return useQuery({
    queryKey: ['insights', 'by-country', searchParamsString],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/insights/by-country', {
        params: { query: parseInsightsQuery(searchParams) },
      });
      if (error) throw error;
      return data;
    },
  });
}
