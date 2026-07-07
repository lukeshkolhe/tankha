import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { parseInsightsQuery } from '../lib/insights-query-params';

/**
 * GET /insights/by-department — per-department, per-currency breakdown
 * (FR-5.2). Same URL-as-cache-key convention as `useOverview`.
 */
export function useDepartmentBreakdown(searchParams: URLSearchParams) {
  const searchParamsString = searchParams.toString();

  return useQuery({
    queryKey: ['insights', 'by-department', searchParamsString],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/insights/by-department', {
        params: { query: parseInsightsQuery(searchParams) },
      });
      if (error) throw error;
      return data;
    },
  });
}
