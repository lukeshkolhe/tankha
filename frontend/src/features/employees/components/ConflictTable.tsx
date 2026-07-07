import { Checkbox, Stack, Table, Text } from '@mantine/core';
import { formatMoney } from '../../../lib/money';
import type { ConflictRow, FieldChange } from '../api/usePreviewImport';

/**
 * ISO 4217 minor-unit digits aren't on `FieldChangeDto` (only the currency
 * code is) — `Intl` already carries this table internally, so deriving it
 * from a throwaway formatter avoids hand-maintaining a duplicate currency ->
 * decimals map just for this diff view.
 */
function minorUnitDigitsForCurrency(currencyCode: string): number {
  return (
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

/** A money field renders both sides through `formatMoney`; anything else renders as plain text. */
export function formatFieldChange(change: FieldChange): { current: string; incoming: string } {
  if (change.currency) {
    const digits = minorUnitDigitsForCurrency(change.currency);
    return {
      current: change.current === null ? '—' : formatMoney(change.current as number, change.currency, digits),
      incoming: formatMoney(change.incoming as number, change.currency, digits),
    };
  }
  return {
    current: change.current === null ? '—' : String(change.current),
    incoming: String(change.incoming),
  };
}

export interface ConflictTableProps {
  conflicts: ConflictRow[];
  /** employeeCodes HR has ticked to apply; a row not in this set is left untouched on commit. */
  selectedCodes: Set<string>;
  onToggle: (employeeCode: string) => void;
  onToggleAll?: (checked: boolean) => void;
}

/** One row per existing-employee conflict: its field-level diff plus an opt-in, default-unchecked checkbox. */
export function ConflictTable({ conflicts, selectedCodes, onToggle, onToggleAll }: ConflictTableProps) {
  const allSelected = conflicts.length > 0 && conflicts.every((row) => selectedCodes.has(row.employeeCode));

  return (
    <Table striped withTableBorder data-testid="conflict-table">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            {onToggleAll ? (
              <Checkbox
                aria-label="Select all conflicts"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.currentTarget.checked)}
              />
            ) : null}
          </Table.Th>
          <Table.Th>Row</Table.Th>
          <Table.Th>Employee code</Table.Th>
          <Table.Th>Changes</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {conflicts.map((conflict) => (
          <Table.Tr key={conflict.employeeCode}>
            <Table.Td>
              <Checkbox
                aria-label={`Apply changes for ${conflict.employeeCode}`}
                checked={selectedCodes.has(conflict.employeeCode)}
                onChange={() => onToggle(conflict.employeeCode)}
              />
            </Table.Td>
            <Table.Td>{conflict.rowNumber}</Table.Td>
            <Table.Td>{conflict.employeeCode}</Table.Td>
            <Table.Td>
              <Stack gap={4}>
                {conflict.changes.map((change) => {
                  const { current, incoming } = formatFieldChange(change);
                  return (
                    <Text size="sm" key={change.field}>
                      <b>{change.field}</b>: {current} → {incoming}
                    </Text>
                  );
                })}
              </Stack>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
