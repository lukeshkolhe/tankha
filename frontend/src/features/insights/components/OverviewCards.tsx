import { Card, Group, SimpleGrid, Text } from '@mantine/core';
import { MoneyText } from '../../../components/MoneyText';
import { themeOther } from '../../../theme';
import { useOverview } from '../api/useOverview';
import { useCurrencies } from '../api/useReferenceLists';
import { toMinorUnitDigitsMap } from '../lib/currency-minor-units';

interface OverviewCardsProps {
  searchParams: URLSearchParams;
}

/**
 * FR-5.1: headcount is currency-agnostic, so it gets exactly one tile; every
 * currency in `byCurrency` gets its OWN tile for total + average. There is no
 * code path here that adds `totalMinor` across currencies into a single
 * headline number — each tile only ever formats its own currency group.
 */
export function OverviewCards({ searchParams }: OverviewCardsProps) {
  const overview = useOverview(searchParams);
  const currencies = useCurrencies();

  if (overview.isLoading || currencies.isLoading) {
    return <Text c="dimmed">Loading overview…</Text>;
  }
  if (overview.isError || !overview.data) {
    return <Text c="red">Could not load the overview.</Text>;
  }

  const minorUnitDigitsByCode = toMinorUnitDigitsMap(currencies.data ?? []);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      <Card withBorder padding="lg">
        <Text size="sm" c="dimmed">
          Headcount
        </Text>
        <Text
          size="26px"
          fw={700}
          ff="monospace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {overview.data.headcount.toLocaleString('en-US')}
        </Text>
      </Card>

      {overview.data.byCurrency.map((group) => {
        const minorUnitDigits = minorUnitDigitsByCode[group.currency] ?? 2;
        const color = themeOther.currencyColors[group.currency] ?? themeOther.inkMuted;

        return (
          <Card withBorder padding="lg" key={group.currency}>
            <Group gap="xs" mb={4}>
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
              <Text size="sm" fw={600}>
                {group.currency}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Headcount
            </Text>
            <Text size="md" fw={600} mb={4}>
              {group.headcount.toLocaleString('en-US')}
            </Text>
            <Text size="xs" c="dimmed">
              Total
            </Text>
            <MoneyText
              amountMinor={group.totalMinor}
              currencyCode={group.currency}
              minorUnitDigits={minorUnitDigits}
              size="20px"
              fw={700}
              mb={4}
            />
            <Text size="xs" c="dimmed">
              Average
            </Text>
            <MoneyText
              amountMinor={group.averageMinor}
              currencyCode={group.currency}
              minorUnitDigits={minorUnitDigits}
              size="md"
              fw={600}
            />
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
