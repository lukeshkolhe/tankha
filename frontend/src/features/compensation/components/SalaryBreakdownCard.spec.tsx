import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { SalaryBreakdownCard } from './SalaryBreakdownCard';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), PUT: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitDigits: 2 },
];

function mockApiFor(salary: unknown) {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/api/v1/employees/{employeeId}/salary') {
      return Promise.resolve({ data: salary, error: undefined, response: new Response() } as never);
    }
    if (url === '/api/v1/reference/currencies') {
      return Promise.resolve({ data: CURRENCIES, error: undefined, response: new Response() } as never);
    }
    throw new Error(`Unexpected GET ${url}`);
  });
}

describe('SalaryBreakdownCard', () => {
  it('renders every fixed component and the total as formatted money, not raw minor-unit numbers', async () => {
    mockApiFor({
      employeeId: 'emp_1',
      currency: 'INR',
      components: [
        { type: 'BASIC', amountMinor: 80000000 },
        { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 40000000 },
        { type: 'SPECIAL_ALLOWANCE', amountMinor: 15000000 },
        { type: 'TRANSPORT_ALLOWANCE', amountMinor: 5000000 },
        { type: 'ANNUAL_BONUS', amountMinor: 2000000 },
      ],
      totalMinor: 142000000,
    });

    renderWithProviders(<SalaryBreakdownCard employeeId="emp_1" currencyCode="INR" />);

    expect(await screen.findByText('₹8,00,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹4,00,000.00')).toBeInTheDocument();
    expect(screen.getByText('House Rent Allowance')).toBeInTheDocument();
    expect(screen.getByText('₹14,20,000.00')).toBeInTheDocument();
    expect(screen.queryByText('142000000')).not.toBeInTheDocument();
  });

  it('shows an Edit salary action for opening the edit modal', async () => {
    mockApiFor({
      employeeId: 'emp_1',
      currency: 'USD',
      components: [{ type: 'BASIC', amountMinor: 100000 }],
      totalMinor: 100000,
    });

    renderWithProviders(<SalaryBreakdownCard employeeId="emp_1" currencyCode="USD" />);

    expect(await screen.findByRole('button', { name: /edit salary/i })).toBeInTheDocument();
  });
});
