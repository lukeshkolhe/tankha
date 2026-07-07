import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { api } from '../../../api/client';
import { useEmployees } from './useEmployees';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const PAGE_RESPONSE = {
  data: [
    {
      id: 'emp_1',
      employeeCode: 'EMP-1001',
      firstName: 'Ravi',
      lastName: 'Kumar',
      department: 'Engineering',
      designation: 'Senior Engineer',
      country: 'IN',
      currency: 'INR',
      status: 'ACTIVE',
      joinDate: '2021-04-01',
      salaryTotalMinor: 12000000,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 25,
};

describe('useEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the employee page using the whitelisted params parsed from the URL', async () => {
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: PAGE_RESPONSE,
      error: undefined,
      response: new Response(),
    } as never);

    const searchParams = new URLSearchParams('search=ravi&country=IN&page=1');
    const { result } = renderHook(() => useEmployees(searchParams), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(PAGE_RESPONSE);
    expect(api.GET).toHaveBeenCalledWith('/api/v1/employees', {
      params: { query: { search: 'ravi', country: 'IN', page: '1' } },
    });
  });

  it('uses the URL search-param string as the query key, so an identical URL hits the same cache entry', async () => {
    vi.mocked(api.GET).mockResolvedValue({
      data: PAGE_RESPONSE,
      error: undefined,
      response: new Response(),
    } as never);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function localWrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const first = renderHook(() => useEmployees(new URLSearchParams('page=1')), {
      wrapper: localWrapper,
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    // A second hook instance built from a *different* URLSearchParams object with
    // the same serialized string must read the already-cached page synchronously.
    const second = renderHook(() => useEmployees(new URLSearchParams('page=1')), {
      wrapper: localWrapper,
    });

    expect(second.result.current.data).toEqual(PAGE_RESPONSE);
  });

  it('propagates an API error so the caller can render an error state', async () => {
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: undefined,
      error: { message: 'boom' },
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useEmployees(new URLSearchParams()), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
