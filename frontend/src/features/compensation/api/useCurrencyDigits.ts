import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';

export const CURRENCIES_QUERY_KEY = ['currencies'] as const;

/**
 * Looks up `minorUnitDigits` for a currency code via
 * `GET /reference/currencies` — needed to convert the edit-salary form's
 * major-unit inputs to the minor-unit integers the API stores. The full
 * currency list is small and effectively static, so it's cached indefinitely
 * and shared across every consumer via the same query key.
 */
export function useCurrencyDigits(currencyCode: string | undefined) {
  const query = useQuery({
    queryKey: CURRENCIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/reference/currencies');
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: currencyCode !== undefined,
    staleTime: Infinity,
  });

  const minorUnitDigits = query.data?.find((currency) => currency.code === currencyCode)
    ?.minorUnitDigits;

  return { ...query, minorUnitDigits };
}
