import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';

export const salaryQueryKey = (employeeId: string) => ['salary', employeeId] as const;

/** GET /employees/:id/salary — the current pay structure (FR-3.1). */
export function useSalary(employeeId: string) {
  return useQuery({
    queryKey: salaryQueryKey(employeeId),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/employees/{employeeId}/salary', {
        params: { path: { employeeId } },
      });
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: employeeId !== '',
  });
}
