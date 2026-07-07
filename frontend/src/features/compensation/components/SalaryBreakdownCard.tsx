import { useState } from 'react';
import { Alert, Button, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { useSalary } from '../api/useSalary';
import { useCurrencyDigits } from '../api/useCurrencyDigits';
import { SALARY_COMPONENT_LABELS, SALARY_COMPONENT_TYPES } from '../lib/salary-math';
import { formatMoney } from '../../../lib/money';
import { EditSalaryModal } from './EditSalaryModal';

interface SalaryBreakdownCardProps {
  employeeId: string;
  currencyCode: string;
}

/**
 * Read-only components + total for the employee's current pay, plus the
 * entry point into the edit flow. The total is always the server-computed
 * figure from `GET .../salary` — never recomputed on this card.
 */
export function SalaryBreakdownCard({ employeeId, currencyCode }: SalaryBreakdownCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const salaryQuery = useSalary(employeeId);
  const { minorUnitDigits } = useCurrencyDigits(currencyCode);

  const isReady = salaryQuery.data !== undefined && minorUnitDigits !== undefined;

  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="lg">
          Salary
        </Text>
        <Button size="xs" variant="light" onClick={() => setIsEditing(true)} disabled={!isReady}>
          Edit salary
        </Button>
      </Group>

      {salaryQuery.isPending && <Loader size="sm" />}
      {salaryQuery.isError && <Alert color="red">Could not load salary details.</Alert>}

      {isReady && (
        <Stack gap="xs">
          {SALARY_COMPONENT_TYPES.map((type) => {
            const component = salaryQuery.data.components.find((item) => item.type === type);
            const amountMinor = component?.amountMinor ?? 0;
            return (
              <Group key={type} justify="space-between">
                <Text c="dimmed" size="sm">
                  {SALARY_COMPONENT_LABELS[type]}
                </Text>
                <Text size="sm">{formatMoney(amountMinor, currencyCode, minorUnitDigits)}</Text>
              </Group>
            );
          })}
          <Group justify="space-between" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Text fw={600}>Total (annual)</Text>
            <Text fw={600}>{formatMoney(salaryQuery.data.totalMinor, currencyCode, minorUnitDigits)}</Text>
          </Group>
        </Stack>
      )}

      {isEditing && isReady && (
        <EditSalaryModal
          employeeId={employeeId}
          currencyCode={currencyCode}
          minorUnitDigits={minorUnitDigits}
          currentComponents={salaryQuery.data.components}
          onClose={() => setIsEditing(false)}
        />
      )}
    </Card>
  );
}
