import { Anchor, Badge, Pagination, Stack, Table, Text } from '@mantine/core';
import { Link, useSearchParams } from 'react-router-dom';
import { formatMoney } from '../../../lib/money';
import { useReferenceData } from '../api/useReferenceData';
import { withUpdatedParam } from '../lib/employee-list-params';
import type { components } from '../../../api/schema';

type EmployeeRowViewDto = components['schemas']['EmployeeRowViewDto'];

export interface EmployeeTableProps {
  rows: EmployeeRowViewDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** Falls back to 2 (the common case) if a row's currency isn't in the reference list yet. */
const DEFAULT_MINOR_UNIT_DIGITS = 2;

/**
 * Renders the current page of the employee list. Pagination reads/writes the
 * `page` URL param itself (via `withUpdatedParam`, same convention as
 * `EmployeeFilters`) rather than taking a callback prop, so the URL stays
 * the single source of truth for list state.
 */
export function EmployeeTable({ rows, total, page, pageSize }: EmployeeTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currencies } = useReferenceData();

  function minorUnitDigitsFor(currencyCode: string): number {
    return (
      currencies.find((currency) => currency.code === currencyCode)?.minorUnitDigits ??
      DEFAULT_MINOR_UNIT_DIGITS
    );
  }

  function handlePageChange(nextPage: number) {
    setSearchParams(withUpdatedParam(searchParams, 'page', String(nextPage)));
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Stack gap="sm">
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Employee</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Designation</Table.Th>
            <Table.Th>Country</Table.Th>
            <Table.Th>Currency</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Salary</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => {
            const isActive = row.status === 'ACTIVE';
            return (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/employees/${row.id}`} fw={500} size="sm">
                    {row.firstName} {row.lastName}
                  </Anchor>
                  <Text size="xs" c="dimmed">
                    {row.employeeCode}
                  </Text>
                </Table.Td>
                <Table.Td>{row.department}</Table.Td>
                <Table.Td>{row.designation}</Table.Td>
                <Table.Td>{row.country}</Table.Td>
                <Table.Td>{row.currency}</Table.Td>
                <Table.Td>
                  <Badge color={isActive ? 'verdigris' : 'gray'} variant="light">
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {row.salaryTotalMinor === null
                    ? '—'
                    : formatMoney(row.salaryTotalMinor, row.currency, minorUnitDigitsFor(row.currency))}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {rows.length === 0 && (
        <Text c="dimmed" ta="center" py="lg">
          No employees found.
        </Text>
      )}

      <Pagination total={totalPages} value={page} onChange={handlePageChange} />
    </Stack>
  );
}
