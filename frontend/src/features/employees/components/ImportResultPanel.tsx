import { Group, Stack, Table, Text } from '@mantine/core';
import type { ImportReport } from '../api/useCommitImport';

export interface ImportResultPanelProps {
  report: ImportReport;
}

/** The final tally after commit: counts plus the same rowNumber/employeeCode/reasons shape as the preview's rejected table. */
export function ImportResultPanel({ report }: ImportResultPanelProps) {
  return (
    <Stack gap="md">
      <Group gap="xl">
        <Text fw={600}>{report.inserted} inserted</Text>
        <Text fw={600}>{report.updated} updated</Text>
        <Text fw={600}>{report.skippedConflicts} skipped conflicts</Text>
        <Text fw={600}>{report.failed.length} failed</Text>
      </Group>

      {report.failed.length > 0 && (
        <Table data-testid="failed-table">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Row</Table.Th>
              <Table.Th>Employee code</Table.Th>
              <Table.Th>Reasons</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {report.failed.map((row) => (
              <Table.Tr key={row.rowNumber}>
                <Table.Td>{row.rowNumber}</Table.Td>
                <Table.Td>{row.employeeCode ?? '—'}</Table.Td>
                <Table.Td>{row.reasons.join(', ')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
