import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { api } from '../../../api/client';
import { useCurrencies, useDepartments, useReferenceData } from './useReferenceData';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useDepartments', () => {
  it('resolves the department reference list from GET /reference/departments', async () => {
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [{ id: 'dep_1', name: 'Engineering' }],
      error: undefined,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useDepartments(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'dep_1', name: 'Engineering' }]);
    expect(api.GET).toHaveBeenCalledWith('/api/v1/reference/departments');
  });
});

describe('useCurrencies', () => {
  it('resolves the currency reference list including minorUnitDigits', async () => {
    vi.mocked(api.GET).mockResolvedValueOnce({
      data: [{ code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 }],
      error: undefined,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useCurrencies(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
    ]);
  });
});

describe('useReferenceData', () => {
  it('bundles all four reference lists with empty-array defaults while loading', async () => {
    vi.mocked(api.GET).mockResolvedValue({
      data: [],
      error: undefined,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useReferenceData(), { wrapper });

    expect(result.current.departments).toEqual([]);
    expect(result.current.designations).toEqual([]);
    expect(result.current.countries).toEqual([]);
    expect(result.current.currencies).toEqual([]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
