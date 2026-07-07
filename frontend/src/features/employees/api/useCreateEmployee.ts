import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';

export type CreateEmployeeDto = components['schemas']['CreateEmployeeDto'];

/**
 * POST /employees — creates the employee + its initial salary in one request.
 * On success the list cache is invalidated (the new row must appear) and the
 * caller is sent to the new employee's detail page.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (body: CreateEmployeeDto) => {
      const { data, error } = await api.POST('/api/v1/employees', { body });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/employees/${data.id}`);
    },
  });
}
