import { useMutation } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import { buildPreviewForm } from './buildImportForm';

export type ImportPreview = components['schemas']['ImportPreviewResponseDto'];
export type ConflictRow = components['schemas']['ConflictRowDto'];
export type FieldChange = components['schemas']['FieldChangeDto'];
export type FailedRow = components['schemas']['FailedRowDto'];

/**
 * Dry-run — POST /employees/import/preview. Persists nothing; buckets the
 * uploaded sheet into `toInsert` / `conflicts` / `invalid` so HR can review
 * before anything is written.
 */
export function usePreviewImport() {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportPreview> => {
      const { data, error } = await api.POST('/api/v1/employees/import/preview', {
        // openapi-fetch's generated type for a binary multipart field doesn't
        // accept a FormData object at the type level even though it's the
        // correct runtime shape for a file upload — `as never` is the known
        // workaround; fetch sets the multipart boundary itself.
        body: buildPreviewForm(file) as never,
      });
      if (error) {
        throw error;
      }
      return data;
    },
  });
}
