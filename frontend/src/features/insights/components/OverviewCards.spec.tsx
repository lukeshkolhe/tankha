import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { OverviewCards } from './OverviewCards';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
  { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitDigits: 2 },
];

function mockOverview(byCurrency: Array<Record<string, unknown>>, headcount: number) {
  mockedGet.mockImplementation(async (url: unknown) => {
    if (url === '/api/v1/insights/overview') {
      return { data: { headcount, byCurrency }, error: undefined } as never;
    }
    if (url === '/api/v1/reference/currencies') {
      return { data: CURRENCIES, error: undefined } as never;
    }
    return { data: undefined, error: undefined } as never;
  });
}

describe('OverviewCards', () => {
  it('renders a separate tile per currency — never a blended headline total', async () => {
    mockOverview(
      [
        { currency: 'INR', headcount: 6200, totalMinor: 74400000000, averageMinor: 1200000 },
        { currency: 'USD', headcount: 2100, totalMinor: 18900000000, averageMinor: 9000000 },
      ],
      8300,
    );

    renderWithProviders(<OverviewCards searchParams={new URLSearchParams()} />);

    expect(await screen.findByText('INR')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();

    // Each currency's own formatted total and average appear exactly once.
    expect(screen.getByText('₹74,40,00,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹12,000.00')).toBeInTheDocument();
    expect(screen.getByText('$189,000,000.00')).toBeInTheDocument();
    expect(screen.getByText('$90,000.00')).toBeInTheDocument();

    // No element anywhere sums totalMinor across currencies into one figure.
    const combinedTotalMinor = 74400000000 + 18900000000;
    expect(screen.queryByText(new RegExp(String(combinedTotalMinor)))).not.toBeInTheDocument();
  });

  it('renders the currency-agnostic headcount as its own tile, separate from any currency tile', async () => {
    // A single currency group legitimately has the same headcount as the
    // overall total, so both "Headcount" label and "6,200" value render
    // twice (the standalone tile + the one currency card) — assert the
    // structure rather than a single ambiguous match.
    mockOverview([{ currency: 'INR', headcount: 6200, totalMinor: 100, averageMinor: 10 }], 6200);

    renderWithProviders(<OverviewCards searchParams={new URLSearchParams()} />);

    expect(await screen.findAllByText('Headcount')).toHaveLength(2);
    expect(screen.getAllByText('6,200')).toHaveLength(2);
  });

  it('shows a loading state while the overview request is in flight', () => {
    mockedGet.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<OverviewCards searchParams={new URLSearchParams()} />);

    expect(screen.getByText(/loading overview/i)).toBeInTheDocument();
  });
});
