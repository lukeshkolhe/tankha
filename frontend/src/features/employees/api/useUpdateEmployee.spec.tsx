import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { api } from '../../../api/client';
import { useUpdateEmployee } from './useUpdateEmployee';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useUpdateEmployee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches the given employee id with the partial UpdateEmployeeDto body', async () => {
    vi.mocked(api.PATCH).mockResolvedValueOnce({
      data: { id: 'emp_1', firstName: 'Ravi' },
      error: undefined,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useUpdateEmployee('emp_1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ firstName: 'Ravi' });
    });

    expect(api.PATCH).toHaveBeenCalledWith('/api/v1/employees/{id}', {
      params: { path: { id: 'emp_1' } },
      body: { firstName: 'Ravi' },
    });
  });

  it('rejects with the raw error body on a validation failure', async () => {
    const validationError = { message: 'Validation failed', details: [{ field: 'countryCode', reason: 'unknown-reference' }] };
    vi.mocked(api.PATCH).mockResolvedValueOnce({
      data: undefined,
      error: validationError,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useUpdateEmployee('emp_1'), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ countryCode: 'ZZ' })).rejects.toEqual(validationError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
