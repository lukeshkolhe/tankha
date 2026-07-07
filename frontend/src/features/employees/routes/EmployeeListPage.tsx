import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Group, Loader, Stack, Title } from '@mantine/core';
import { useEmployees } from '../api/useEmployees';
import { EmployeeFilters } from '../components/EmployeeFilters';
import { EmployeeTable } from '../components/EmployeeTable';
import { ExportButton } from '../components/ExportButton';
import { ImportDialog } from '../components/ImportDialog';

/**
 * The employee list: URL-driven filters + pagination (via `useEmployees`),
 * plus the module's import/export controls, which live here per the
 * workforce architecture (there is no standalone import/export route).
 */
export function EmployeeListPage() {
  const [searchParams] = useSearchParams();
  const [importOpened, setImportOpened] = useState(false);
  const employees = useEmployees(searchParams);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={2}>Employees</Title>
        <Group>
          <Button variant="default" onClick={() => setImportOpened(true)}>
            Import
          </Button>
          <ExportButton />
          <Button component={Link} to="/employees/new">
            Add employee
          </Button>
        </Group>
      </Group>

      <EmployeeFilters />

      {employees.isLoading && <Loader />}
      {employees.isError && <Alert color="red">Could not load employees.</Alert>}
      {employees.data && (
        <EmployeeTable
          rows={employees.data.data}
          total={employees.data.total}
          page={employees.data.page}
          pageSize={employees.data.pageSize}
        />
      )}

      <ImportDialog opened={importOpened} onClose={() => setImportOpened(false)} />
    </Stack>
  );
}
