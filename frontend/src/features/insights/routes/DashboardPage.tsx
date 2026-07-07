import { Stack } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { CountryBreakdown } from '../components/CountryBreakdown';
import { DepartmentBreakdown } from '../components/DepartmentBreakdown';
import { InsightsFilters } from '../components/InsightsFilters';
import { OverviewCards } from '../components/OverviewCards';

/**
 * The landing page after login (FR-5.1–5.3): shared filters, then the
 * currency-explicit overview, then the department and country breakdowns —
 * all reading the one URL search-param state so the whole page always
 * describes the same filtered population.
 */
export function DashboardPage() {
  const [searchParams] = useSearchParams();

  return (
    <Stack gap="xl">
      <InsightsFilters />
      <OverviewCards searchParams={searchParams} />
      <DepartmentBreakdown searchParams={searchParams} />
      <CountryBreakdown searchParams={searchParams} />
    </Stack>
  );
}
