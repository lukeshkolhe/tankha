import { Group, Stack, Text } from '@mantine/core';
import { MoneyText } from '../../../components/MoneyText';
import { themeOther } from '../../../theme';
import { useDepartmentBreakdown } from '../api/useDepartmentBreakdown';
import { useCurrencies } from '../api/useReferenceLists';
import { headcountToBarWidthPercent } from '../lib/bar-width';
import { toMinorUnitDigitsMap } from '../lib/currency-minor-units';
import type { components } from '../../../api/schema';

type BreakdownRow = components['schemas']['BreakdownRowDto'];

interface DepartmentBreakdownProps {
  searchParams: URLSearchParams;
}

function maxHeadcountAcross(rows: BreakdownRow[]): number {
  return rows.reduce(
    (max, row) => row.currencyGroups.reduce((rowMax, group) => Math.max(rowMax, group.headcount), max),
    0,
  );
}

function currenciesPresentIn(rows: BreakdownRow[]): string[] {
  const present = new Set(rows.flatMap((row) => row.currencyGroups.map((group) => group.currency)));
  return Object.keys(themeOther.currencyColors).filter((code) => present.has(code));
}

/**
 * FR-5.2: headcount — a count, currency-agnostic — is the ONLY thing encoded
 * as bar length, since ₹ and $ totals can't share one axis. Each currency
 * present in a department gets its own bar, colored from the app's fixed
 * currency palette, directly labeled with its own average — never a bar or
 * label that blends more than one currency.
 */
export function DepartmentBreakdown({ searchParams }: DepartmentBreakdownProps) {
  const breakdown = useDepartmentBreakdown(searchParams);
  const currencies = useCurrencies();

  if (breakdown.isLoading || currencies.isLoading) {
    return <Text c="dimmed">Loading department breakdown…</Text>;
  }
  if (breakdown.isError || !breakdown.data) {
    return <Text c="red">Could not load the department breakdown.</Text>;
  }

  const rows = breakdown.data.breakdown;
  const maxHeadcount = maxHeadcountAcross(rows);
  const legendCurrencies = currenciesPresentIn(rows);
  const minorUnitDigitsByCode = toMinorUnitDigitsMap(currencies.data ?? []);

  return (
    <Stack gap="lg">
      <Text fw={600} size="lg">
        By department
      </Text>

      {legendCurrencies.length > 1 && (
        <Group gap="md" aria-label="Currency legend">
          {legendCurrencies.map((code) => (
            <Group gap={6} key={code}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: themeOther.currencyColors[code],
                }}
              />
              <Text size="xs" c="dimmed">
                {code}
              </Text>
            </Group>
          ))}
        </Group>
      )}

      {rows.map((row) => (
        <div key={row.dimension}>
          <Text fw={600} mb={6}>
            {row.dimension}
          </Text>
          <Stack gap={8}>
            {row.currencyGroups.map((group) => {
              const widthPercent = headcountToBarWidthPercent(group.headcount, maxHeadcount);
              const minorUnitDigits = minorUnitDigitsByCode[group.currency] ?? 2;

              return (
                <div key={group.currency}>
                  <Group justify="space-between" mb={2}>
                    <Text size="xs" c="dimmed">
                      {group.currency} · {group.headcount.toLocaleString('en-US')} employees
                    </Text>
                    <Group gap={4}>
                      <Text size="xs" fw={600} c="dimmed">
                        avg
                      </Text>
                      <MoneyText
                        amountMinor={group.averageMinor}
                        currencyCode={group.currency}
                        minorUnitDigits={minorUnitDigits}
                        size="xs"
                        fw={600}
                      />
                    </Group>
                  </Group>
                  <div
                    role="img"
                    aria-label={`${row.dimension} ${group.currency} headcount ${group.headcount}`}
                    style={{ height: 8, borderRadius: 4, background: themeOther.line }}
                  >
                    <div
                      style={{
                        width: `${widthPercent}%`,
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: themeOther.currencyColors[group.currency] ?? themeOther.inkMuted,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Stack>
        </div>
      ))}
    </Stack>
  );
}
