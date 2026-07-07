import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import { buildCommitForm } from './buildImportForm';

export type ImportReport = components['schemas']['ImportReportResponseDto'];

export interface CommitImportInput {
  file: File;
  applyEmployeeCodes: string[];
}

/**
 * Applies the import — POST /employees/import/commit. Re-sends the same
 * `File` the user picked at preview time (the server is stateless) plus the
 * `employeeCode`s HR ticked to override; unticked conflicts are left
 * untouched. Invalidates the employees list so a successful import is
 * reflected immediately.
 */
export function useCommitImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, applyEmployeeCodes }: CommitImportInput): Promise<ImportReport> => {
      const { data, error } = await api.POST('/api/v1/employees/import/commit', {
        body: buildCommitForm(file, applyEmployeeCodes) as never,
      });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
