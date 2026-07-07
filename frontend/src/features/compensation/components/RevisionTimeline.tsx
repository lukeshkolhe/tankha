import { Group, Stack, Text } from '@mantine/core';
import { MoneyText } from '../../../components/MoneyText';
import { formatDate } from '../../../lib/format-date';
import { themeOther } from '../../../theme';
import { useRevisions } from '../api/useRevisions';

export interface RevisionTimelineProps {
  employeeId: string;
}

/**
 * `RevisionViewDto` carries a currency code but not its minor-unit digit
 * count (that lives on the reference Currency list, not the revision), so a
 * second lookup would be needed for full precision. This read-only history
 * view defaults to 2 — correct for the overwhelming majority of currencies —
 * rather than add another query dependency to a display-only component.
 */
const DEFAULT_MINOR_UNIT_DIGITS = 2;

/**
 * The append-only salary-change timeline (FR-3.3), newest-first exactly as
 * the API returns it. The initial revision (oldTotalMinor null) shows only
 * its remark and new total — no "from" value, no arrow — every later one
 * shows old → new.
 */
export function RevisionTimeline({ employeeId }: RevisionTimelineProps) {
  const revisions = useRevisions(employeeId);

  if (revisions.isLoading) {
    return <Text c="dimmed">Loading history…</Text>;
  }
  if (revisions.isError || !revisions.data) {
    return <Text c="red">Could not load the salary history.</Text>;
  }

  return (
    <Stack gap="md">
      {revisions.data.data.map((revision) => {
        const oldTotalMinor: number | null = revision.oldTotalMinor;
        return (
          <div key={revision.id}>
            <Text size="xs" c="dimmed">
              {formatDate(revision.createdAt)}
            </Text>
            <Text fw={600}>{revision.remark}</Text>
            <Text size="sm" c="dimmed">
              {revision.changedBy.name}
            </Text>
            <Group gap={6} mt={2}>
              {oldTotalMinor !== null && (
                <>
                  <MoneyText
                    amountMinor={oldTotalMinor}
                    currencyCode={revision.currency}
                    minorUnitDigits={DEFAULT_MINOR_UNIT_DIGITS}
                    size="sm"
                    c="dimmed"
                  />
                  <Text component="span" c="dimmed">
                    →
                  </Text>
                </>
              )}
              <MoneyText
                amountMinor={revision.newTotalMinor}
                currencyCode={revision.currency}
                minorUnitDigits={DEFAULT_MINOR_UNIT_DIGITS}
                size="md"
                fw={700}
                c={themeOther.brass}
              />
            </Group>
          </div>
        );
      })}
    </Stack>
  );
}
