import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';

type EditSalaryDto = components['schemas']['EditSalaryDto'];

/**
 * PUT /employees/:id/salary — replace the components, recompute the total
 * server-side, and append a revision (FR-3.2, FR-3.3). Currency is never
 * sent; it always follows the employee.
 *
 * On success, invalidates every surface that shows a salary total: the
 * salary card itself, the appraisal timeline, the employee list, and the
 * single-employee query (if one is cached for this id).
 */
export function useEditSalary(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditSalaryDto) => {
      const { data, error } = await api.PUT('/api/v1/employees/{employeeId}/salary', {
        params: { path: { employeeId } },
        body: input,
      });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['salary', employeeId] });
      void queryClient.invalidateQueries({ queryKey: ['revisions', employeeId] });
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}
