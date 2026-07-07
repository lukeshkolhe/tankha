import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { DepartmentBreakdown } from './DepartmentBreakdown';
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
    if (url === '/api/v1/insights/by-department') {
      return { data: { breakdown }, error: undefined } as never;
    }
    if (url === '/api/v1/reference/currencies') {
      return { data: CURRENCIES, error: undefined } as never;
    }
    return { data: undefined, error: undefined } as never;
  });
}

describe('DepartmentBreakdown', () => {
  it('renders one bar per currency present in a mixed-currency department, not blended into one bar', async () => {
    mockBreakdown([
      {
        dimension: 'Engineering',
        currencyGroups: [
          { currency: 'INR', headcount: 3200, totalMinor: 41600000000, averageMinor: 1300000 },
          { currency: 'USD', headcount: 900, totalMinor: 9000000000, averageMinor: 10000000 },
        ],
      },
    ]);

    renderWithProviders(<DepartmentBreakdown searchParams={new URLSearchParams()} />);

    await screen.findByText('Engineering');

    const inrBar = screen.getByRole('img', { name: 'Engineering INR headcount 3200' });
    const usdBar = screen.getByRole('img', { name: 'Engineering USD headcount 900' });
    expect(inrBar).toBeInTheDocument();
    expect(usdBar).toBeInTheDocument();
  });

  it('sizes bar proportions by headcount, not money — the smaller-total currency can draw the wider bar', async () => {
    // USD has a far larger average/total per head than INR, but fewer heads;
    // the bar width must track the 3200-vs-900 headcount split, not money.
    mockBreakdown([
      {
        dimension: 'Engineering',
        currencyGroups: [
          { currency: 'INR', headcount: 3200, totalMinor: 41600000000, averageMinor: 1300000 },
          { currency: 'USD', headcount: 900, totalMinor: 9000000000, averageMinor: 10000000 },
        ],
      },
    ]);

    renderWithProviders(<DepartmentBreakdown searchParams={new URLSearchParams()} />);
    await screen.findByText('Engineering');

    const inrBar = screen.getByRole('img', { name: 'Engineering INR headcount 3200' });
    const usdBar = screen.getByRole('img', { name: 'Engineering USD headcount 900' });
    const inrFillWidth = parseFloat((inrBar.firstElementChild as HTMLElement).style.width);
    const usdFillWidth = parseFloat((usdBar.firstElementChild as HTMLElement).style.width);

    expect(inrFillWidth).toBe(100); // 3200 is the max headcount across the chart
    expect(usdFillWidth).toBeCloseTo((900 / 3200) * 100, 5);
    expect(inrFillWidth).toBeGreaterThan(usdFillWidth);
  });

  it("labels each bar with the correctly formatted average in ITS OWN currency", async () => {
    mockBreakdown([
      {
        dimension: 'Engineering',
        currencyGroups: [
          { currency: 'INR', headcount: 3200, totalMinor: 41600000000, averageMinor: 1300000 },
          { currency: 'USD', headcount: 900, totalMinor: 9000000000, averageMinor: 10000000 },
        ],
      },
    ]);

    renderWithProviders(<DepartmentBreakdown searchParams={new URLSearchParams()} />);
    await screen.findByText('Engineering');

    // "avg" and the formatted figure are separate elements (the figure gets
    // its own tabular-mono treatment via MoneyText) — assert both render.
    expect(screen.getAllByText('avg')).toHaveLength(2);
    expect(screen.getByText('₹13,000.00')).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
  });

  it('renders a single-currency legend entry once even with several mixed departments', async () => {
    mockBreakdown([
      {
        dimension: 'Engineering',
        currencyGroups: [
          { currency: 'INR', headcount: 3200, totalMinor: 41600000000, averageMinor: 1300000 },
          { currency: 'USD', headcount: 900, totalMinor: 9000000000, averageMinor: 10000000 },
        ],
      },
      {
        dimension: 'Sales',
        currencyGroups: [{ currency: 'INR', headcount: 1500, totalMinor: 15000000000, averageMinor: 1000000 }],
      },
    ]);

    renderWithProviders(<DepartmentBreakdown searchParams={new URLSearchParams()} />);
    await screen.findByText('Engineering');

    const legend = screen.getByLabelText('Currency legend');
    expect(legend.textContent).toContain('INR');
    expect(legend.textContent).toContain('USD');
    // Fixed palette order (INR before USD) — never per-chart reassignment.
    expect(legend.textContent!.indexOf('INR')).toBeLessThan(legend.textContent!.indexOf('USD'));
  });
});
