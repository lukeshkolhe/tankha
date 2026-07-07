import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { CountryBreakdown } from './CountryBreakdown';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitDigits: 2 },
];

function mockBreakdown(breakdown: Array<Record<string, unknown>>) {
  mockedGet.mockImplementation(async (url: unknown) => {
    if (url === '/api/v1/insights/by-country') {
      return { data: { breakdown }, error: undefined } as never;
    }
    if (url === '/api/v1/reference/currencies') {
      return { data: CURRENCIES, error: undefined } as never;
    }
    return { data: undefined, error: undefined } as never;
  });
}

describe('CountryBreakdown', () => {
  it('renders one row per (country, currency) with correctly currency-formatted averages', async () => {
    mockBreakdown([
      {
        dimension: 'India',
        currencyGroups: [{ currency: 'INR', headcount: 3200, totalMinor: 41600000000, averageMinor: 1300000 }],
      },
      {
        dimension: 'United States',
        currencyGroups: [{ currency: 'USD', headcount: 900, totalMinor: 9000000000, averageMinor: 10000000 }],
      },
    ]);

    renderWithProviders(<CountryBreakdown searchParams={new URLSearchParams()} />);

    expect(await screen.findByText('India')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('₹13,000.00')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
  });

  it('renders a row per currency when a single country has more than one currency group', async () => {
    mockBreakdown([
      {
        dimension: 'India',
        currencyGroups: [
          { currency: 'INR', headcount: 3000, totalMinor: 3000000000, averageMinor: 1000000 },
          { currency: 'USD', headcount: 50, totalMinor: 500000000, averageMinor: 10000000 },
        ],
      },
    ]);

    renderWithProviders(<CountryBreakdown searchParams={new URLSearchParams()} />);

    const rows = await screen.findAllByText('India');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('₹10,000.00')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
  });
});
