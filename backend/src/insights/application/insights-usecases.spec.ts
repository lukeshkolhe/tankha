import { InMemoryInsightRepository } from './testing/in-memory-insight.repository';
import { GetOverviewUseCase } from './get-overview.usecase';
import { GetDepartmentBreakdownUseCase } from './get-department-breakdown.usecase';
import { GetCountryBreakdownUseCase } from './get-country-breakdown.usecase';

const noFilter = {};

describe('GetOverviewUseCase', () => {
  it('builds one currency group per currency with integer averages', async () => {
    const repo = new InMemoryInsightRepository([
      { currency: 'INR', headcount: 2, totalMinor: 24000000 },
      { currency: 'USD', headcount: 4, totalMinor: 36000000 },
    ]);

    const view = await new GetOverviewUseCase(repo).execute(noFilter);

    expect(view.byCurrency).toEqual([
      { currency: 'INR', headcount: 2, totalMinor: 24000000, averageMinor: 12000000 },
      { currency: 'USD', headcount: 4, totalMinor: 36000000, averageMinor: 9000000 },
    ]);
  });

  it('sums headcount (a count) across currencies but never sums totalMinor', async () => {
    const repo = new InMemoryInsightRepository([
      { currency: 'INR', headcount: 6200, totalMinor: 74400000000 },
      { currency: 'USD', headcount: 2100, totalMinor: 18900000000 },
    ]);

    const view = await new GetOverviewUseCase(repo).execute(noFilter);

    expect(view.headcount).toBe(8300);
    const totals = view.byCurrency.map((group) => group.totalMinor);
    expect(totals).toEqual([74400000000, 18900000000]);
    expect(Object.keys(view)).toEqual(['headcount', 'byCurrency']); // no blended grand total field
  });

  it('floors the average by integer division within a currency', async () => {
    const repo = new InMemoryInsightRepository([{ currency: 'INR', headcount: 3, totalMinor: 100 }]);

    const view = await new GetOverviewUseCase(repo).execute(noFilter);

    expect(view.byCurrency[0].averageMinor).toBe(33); // floor(100 / 3)
  });

  it('returns headcount 0 and empty groups for an org with no data', async () => {
    const view = await new GetOverviewUseCase(new InMemoryInsightRepository([])).execute(noFilter);

    expect(view.headcount).toBe(0);
    expect(view.byCurrency).toEqual([]);
  });
});

describe('GetDepartmentBreakdownUseCase', () => {
  it('yields multiple currency groups for a mixed-currency department, never a blended total', async () => {
    const repo = new InMemoryInsightRepository(
      [],
      [
        { dimension: 'Engineering', currency: 'INR', headcount: 3200, totalMinor: 41600000000 },
        { dimension: 'Engineering', currency: 'USD', headcount: 900, totalMinor: 9000000000 },
        { dimension: 'Sales', currency: 'INR', headcount: 1500, totalMinor: 15000000000 },
      ],
    );

    const view = await new GetDepartmentBreakdownUseCase(repo).execute(noFilter);

    const engineering = view.breakdown.find((row) => row.dimension === 'Engineering');
    expect(engineering?.currencyGroups).toEqual([
      { currency: 'INR', headcount: 3200, totalMinor: 41600000000, averageMinor: 13000000 },
      { currency: 'USD', headcount: 900, totalMinor: 9000000000, averageMinor: 10000000 },
    ]);
  });

  it('keeps a single-currency department to one currency group', async () => {
    const repo = new InMemoryInsightRepository(
      [],
      [{ dimension: 'Sales', currency: 'INR', headcount: 1500, totalMinor: 15000000000 }],
    );

    const view = await new GetDepartmentBreakdownUseCase(repo).execute(noFilter);

    expect(view.breakdown).toEqual([
      {
        dimension: 'Sales',
        currencyGroups: [
          { currency: 'INR', headcount: 1500, totalMinor: 15000000000, averageMinor: 10000000 },
        ],
      },
    ]);
  });

  it('returns an empty breakdown for an org with no data', async () => {
    const view = await new GetDepartmentBreakdownUseCase(new InMemoryInsightRepository()).execute(noFilter);

    expect(view.breakdown).toEqual([]);
  });
});

describe('GetCountryBreakdownUseCase', () => {
  it('builds a per-country breakdown with per-currency groups', async () => {
    const repo = new InMemoryInsightRepository(
      [],
      [],
      [
        { dimension: 'India', currency: 'INR', headcount: 6200, totalMinor: 74400000000 },
        { dimension: 'United States', currency: 'USD', headcount: 2100, totalMinor: 18900000000 },
      ],
    );

    const view = await new GetCountryBreakdownUseCase(repo).execute(noFilter);

    expect(view.breakdown).toEqual([
      {
        dimension: 'India',
        currencyGroups: [
          { currency: 'INR', headcount: 6200, totalMinor: 74400000000, averageMinor: 12000000 },
        ],
      },
      {
        dimension: 'United States',
        currencyGroups: [
          { currency: 'USD', headcount: 2100, totalMinor: 18900000000, averageMinor: 9000000 },
        ],
      },
    ]);
  });
});
