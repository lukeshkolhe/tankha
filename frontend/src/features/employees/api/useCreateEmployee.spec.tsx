import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../../../api/client';
import { useCreateEmployee } from './useCreateEmployee';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const CREATE_PAYLOAD = {
  employeeCode: 'EMP-1001',
  firstName: 'Ravi',
  lastName: 'Kumar',
  departmentId: 'dep_1',
  designationId: 'des_1',
  countryCode: 'IN',
  currencyCode: 'INR',
  joinDate: '2021-04-01',
  salary: { components: [{ type: 'BASIC' as const, amountMinor: 8000000 }] },
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('useCreateEmployee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the CreateEmployeeDto body and navigates to the new employee detail page on success', async () => {
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: { id: 'emp_new_1' },
      error: undefined,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(CREATE_PAYLOAD);
    });

    expect(api.POST).toHaveBeenCalledWith('/api/v1/employees', { body: CREATE_PAYLOAD });
    expect(mockNavigate).toHaveBeenCalledWith('/employees/emp_new_1');
  });

  it('rejects with the raw error body (incl. details) on a 409 duplicate employeeCode', async () => {
    const conflictError = { message: 'Conflict', details: [{ field: 'employeeCode', reason: 'duplicate' }] };
    vi.mocked(api.POST).mockResolvedValueOnce({
      data: undefined,
      error: conflictError,
      response: new Response(),
    } as never);

    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(CREATE_PAYLOAD)).rejects.toEqual(conflictError);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
