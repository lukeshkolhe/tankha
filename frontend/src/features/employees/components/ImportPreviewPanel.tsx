import { Stack, Table, Text } from '@mantine/core';
import type { ImportPreview } from '../api/usePreviewImport';
import { ConflictTable } from './ConflictTable';

export interface ImportPreviewPanelProps {
  preview: ImportPreview;
  selectedCodes: Set<string>;
  onToggleConflict: (employeeCode: string) => void;
  onToggleAll?: (checked: boolean) => void;
}

/**
 * The centrepiece of the import flow: three buckets, nothing written yet.
 * `toInsert` is a plain count (those rows have no existing record to diff
 * against); conflicts get the full per-row diff + checkbox; invalid rows are
 * rejected regardless of any choice HR makes.
 */
export function ImportPreviewPanel({
  preview,
  selectedCodes,
  onToggleConflict,
  onToggleAll,
}: ImportPreviewPanelProps) {
  return (
    <Stack gap="md">
      <Text fw={600}>
        {preview.toInsert} new employee{preview.toInsert === 1 ? '' : 's'} will be created
      </Text>

      {preview.conflicts.length > 0 && (
        <Stack gap="xs">
          <Text fw={600}>Existing employees found ({preview.conflicts.length}) — tick to apply changes</Text>
          <ConflictTable
            conflicts={preview.conflicts}
            selectedCodes={selectedCodes}
            onToggle={onToggleConflict}
            onToggleAll={onToggleAll}
          />
        </Stack>
      )}

      {preview.invalid.length > 0 && (
        <Stack gap="xs">
          <Text fw={600}>Rejected rows ({preview.invalid.length})</Text>
          <Table data-testid="invalid-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Row</Table.Th>
                <Table.Th>Employee code</Table.Th>
                <Table.Th>Reasons</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {preview.invalid.map((row) => (
                <Table.Tr key={row.rowNumber}>
                  <Table.Td>{row.rowNumber}</Table.Td>
                  <Table.Td>{row.employeeCode ?? '—'}</Table.Td>
                  <Table.Td>{row.reasons.join(', ')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      )}
    </Stack>
  );
}
