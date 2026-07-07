import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';

type RevisionPageDto = components['schemas']['RevisionPageDto'];

export const revisionsQueryKey = (employeeId: string, page: number) =>
  ['revisions', employeeId, page] as const;

const DEFAULT_PAGE_SIZE = 25;

/**
 * GET /employees/:id/salary/revisions — the paged, newest-first appraisal
 * history (FR-3.3).
 *
 * The generated `schema.d.ts` types this operation's query params as `never`
 * (the backend's OpenAPI decorators omit `@ApiQuery` here), even though the
 * API contract documents `page`/`pageSize` paging identically to the
 * employee list endpoint. Rather than hand-editing the generated schema, the
 * request options are cast locally so the documented query params still
 * reach the server.
 */
export function useRevisions(employeeId: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: revisionsQueryKey(employeeId, page),
    queryFn: async () => {
      const requestOptions = {
        params: {
          path: { employeeId },
          query: { page: String(page), pageSize: String(pageSize) },
        },
      };
      // The generated type for this operation's `query` is `never` (see note
      // above); `api.GET` is cast to a hand-written signature that still
      // accepts the runtime page/pageSize params it needs to send, without
      // touching the generated schema.
      const getRevisions = api.GET as (
        url: '/api/v1/employees/{employeeId}/salary/revisions',
        init: typeof requestOptions,
      ) => Promise<{ data: RevisionPageDto; error?: never } | { data?: never; error: unknown }>;
      const { data, error } = await getRevisions(
        '/api/v1/employees/{employeeId}/salary/revisions',
        requestOptions,
      );
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: employeeId !== '',
  });
}
