import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';

export const employeeQueryKey = (employeeId: string) => ['employee', employeeId] as const;

/** GET /employees/:id — full detail incl. current salary summary. */
export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: employeeQueryKey(employeeId),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/employees/{id}', {
        params: { path: { id: employeeId } },
      });
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: employeeId !== '',
  });
}

function useEmployeeStatusMutation(employeeId: string, action: 'deactivate' | 'reactivate') {
  const queryClient = useQueryClient();
  const path =
    action === 'deactivate' ? '/api/v1/employees/{id}/deactivate' : '/api/v1/employees/{id}/reactivate';

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST(path, {
        params: { path: { id: employeeId } },
      });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(employeeQueryKey(employeeId), data);
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

/** POST /employees/:id/deactivate — soft deactivate, status INACTIVE, history preserved. */
export function useDeactivateEmployee(employeeId: string) {
  return useEmployeeStatusMutation(employeeId, 'deactivate');
}

/** POST /employees/:id/reactivate — restore status ACTIVE. */
export function useReactivateEmployee(employeeId: string) {
  return useEmployeeStatusMutation(employeeId, 'reactivate');
}
