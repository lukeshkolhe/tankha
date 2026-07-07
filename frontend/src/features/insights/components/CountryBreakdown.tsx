import { Table, Text } from '@mantine/core';
import { formatMoney } from '../../../lib/money';
import { useCountryBreakdown } from '../api/useCountryBreakdown';
import { useCurrencies } from '../api/useReferenceLists';
import { toMinorUnitDigitsMap } from '../lib/currency-minor-units';

interface CountryBreakdownProps {
  searchParams: URLSearchParams;
}

/**
 * FR-5.2: each country's `currencyGroups` typically holds a single currency,
 * so a table row per (country, currency) is more honest here than a chart —
 * per the dataviz skill's "is it even a chart?" step. Every average is
 * formatted in its own currency; no column ever sums across rows.
 */
export function CountryBreakdown({ searchParams }: CountryBreakdownProps) {
  const breakdown = useCountryBreakdown(searchParams);
  const currencies = useCurrencies();

  if (breakdown.isLoading || currencies.isLoading) {
    return <Text c="dimmed">Loading country breakdown…</Text>;
  }
  if (breakdown.isError || !breakdown.data) {
    return <Text c="red">Could not load the country breakdown.</Text>;
  }

  const minorUnitDigitsByCode = toMinorUnitDigitsMap(currencies.data ?? []);
  const rows = breakdown.data.breakdown.flatMap((row) =>
    row.currencyGroups.map((group) => ({ dimension: row.dimension, ...group })),
  );

  return (
    <div>
      <Text fw={600} size="lg" mb={8}>
        By country
      </Text>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Country</Table.Th>
            <Table.Th>Currency</Table.Th>
            <Table.Th>Headcount</Table.Th>
            <Table.Th>Average</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={`${row.dimension}-${row.currency}`}>
              <Table.Td>{row.dimension}</Table.Td>
              <Table.Td>{row.currency}</Table.Td>
              <Table.Td>{row.headcount.toLocaleString('en-US')}</Table.Td>
              <Table.Td>
                {formatMoney(row.averageMinor, row.currency, minorUnitDigitsByCode[row.currency] ?? 2)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
