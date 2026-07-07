import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEditSalary } from './useEditSalary';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { PUT: vi.fn() },
}));

const mockedPut = vi.mocked(api.PUT);

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useEditSalary', () => {
  it('invalidates the salary, revisions, employee list, and single-employee queries on success — every surface showing pay stays in sync', async () => {
    mockedPut.mockResolvedValue({
      data: { employeeId: 'emp_1', currency: 'INR', components: [], totalMinor: 9000000 },
      error: undefined,
      response: new Response(),
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useEditSalary('emp_1'), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({
      components: [{ type: 'BASIC', amountMinor: 9000000 }],
      remark: 'Annual increment',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(['salary', 'emp_1']);
    expect(invalidatedKeys).toContainEqual(['revisions', 'emp_1']);
    expect(invalidatedKeys).toContainEqual(['employees']);
    expect(invalidatedKeys).toContainEqual(['employee', 'emp_1']);
  });

  it('calls PUT with the employee id in the path and the exact {components, remark} body, no currency field', async () => {
    mockedPut.mockResolvedValue({
      data: { employeeId: 'emp_2', currency: 'USD', components: [], totalMinor: 1000 },
      error: undefined,
      response: new Response(),
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useEditSalary('emp_2'), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({
      components: [{ type: 'BASIC', amountMinor: 1000 }],
      remark: 'Correction',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedPut).toHaveBeenCalledWith('/api/v1/employees/{employeeId}/salary', {
      params: { path: { employeeId: 'emp_2' } },
      body: { components: [{ type: 'BASIC', amountMinor: 1000 }], remark: 'Correction' },
    });
  });
});
