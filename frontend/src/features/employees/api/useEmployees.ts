import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { parseEmployeeListQuery } from '../lib/employee-list-params';

/**
 * GET /employees — server-paginated list. The query key is the URL's own
 * search-param string, so the URL *is* the TanStack Query cache key: identical
 * URLs always hit the same cache entry, and a changed filter always refetches
 * (per the workforce module's URL-as-source-of-truth convention).
 */
export function useEmployees(searchParams: URLSearchParams) {
  const queryString = searchParams.toString();

  return useQuery({
    queryKey: ['employees', queryString],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/employees', {
        params: { query: parseEmployeeListQuery(searchParams) },
      });
      if (error) throw error;
      return data;
    },
  });
}
