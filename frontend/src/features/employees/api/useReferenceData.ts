import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';

/**
 * Reference lists feed dropdowns only and change essentially never within a
 * session — `staleTime: Infinity` means each list is fetched once per app
 * load and then served from cache for every filter/form that needs it.
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

export function useDesignations() {
  return useQuery({
    queryKey: ['reference', 'designations'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/reference/designations');
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

/** Convenience bundle for components (EmployeeForm, EmployeeFilters) that need every list at once. */
export function useReferenceData() {
  const departments = useDepartments();
  const designations = useDesignations();
  const countries = useCountries();
  const currencies = useCurrencies();

  return {
    departments: departments.data ?? [],
    designations: designations.data ?? [],
    countries: countries.data ?? [],
    currencies: currencies.data ?? [],
    isLoading:
      departments.isLoading || designations.isLoading || countries.isLoading || currencies.isLoading,
  };
}
