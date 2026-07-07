import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';

/**
 * Reference lists feed filter dropdowns and money formatting and change
 * essentially never within a session, so each is fetched once per app load
 * and served from cache thereafter. Query keys match the `reference/*`
 * lists elsewhere in the app, so this feature shares one cache entry with
 * any other view that fetches the same reference data.
 */
const REFERENCE_QUERY_OPTIONS = { staleTime: Infinity, retry: false } as const;

export function useDepartments() {
  return useQuery({
    queryKey: ['reference', 'departments'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/reference/departments');
      if (error) throw error;
      return data;
    },
    ...REFERENCE_QUERY_OPTIONS,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['reference', 'countries'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/reference/countries');
      if (error) throw error;
      return data;
    },
    ...REFERENCE_QUERY_OPTIONS,
  });
}

/** Currency reference data — mainly consulted for `minorUnitDigits`, since insights DTOs carry only a currency code. */
export function useCurrencies() {
  return useQuery({
    queryKey: ['reference', 'currencies'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/reference/currencies');
      if (error) throw error;
      return data;
    },
    ...REFERENCE_QUERY_OPTIONS,
  });
}
