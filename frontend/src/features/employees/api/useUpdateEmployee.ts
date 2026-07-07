import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';

export type UpdateEmployeeDto = components['schemas']['UpdateEmployeeDto'];

/**
 * PATCH /employees/:id — edits core attributes only (never salary). On
 * success both the list and that employee's detail cache are invalidated so
 * neither view can show stale attributes.
 */
export function useUpdateEmployee(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateEmployeeDto) => {
      const { data, error } = await api.PATCH('/api/v1/employees/{id}', {
        params: { path: { id: employeeId } },
        body,
      });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}
