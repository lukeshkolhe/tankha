import { useState } from 'react';
import { Alert, Button, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { useSalary } from '../api/useSalary';
import { useCurrencyDigits } from '../api/useCurrencyDigits';
import { SALARY_COMPONENT_LABELS, SALARY_COMPONENT_TYPES } from '../lib/salary-math';
import { MoneyText } from '../../../components/MoneyText';
import { themeOther } from '../../../theme';
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
                <MoneyText
                  amountMinor={amountMinor}
                  currencyCode={currencyCode}
                  minorUnitDigits={minorUnitDigits}
                  size="sm"
                />
              </Group>
            );
          })}
          <Group justify="space-between" pt="xs" style={{ borderTop: `2px solid ${themeOther.ink}` }}>
            <Text fw={700} size="13px">
              Total (annual)
            </Text>
            <MoneyText
              amountMinor={salaryQuery.data.totalMinor}
              currencyCode={currencyCode}
              minorUnitDigits={minorUnitDigits}
              size="20px"
              fw={700}
            />
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
