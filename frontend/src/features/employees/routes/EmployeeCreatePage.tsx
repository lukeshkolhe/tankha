import { Stack, Title } from '@mantine/core';
import { useCreateEmployee } from '../api/useCreateEmployee';
import { EmployeeForm } from '../components/EmployeeForm';

/** New-employee page: attrs + the 5-row salary sub-form, posted in one request. */
export function EmployeeCreatePage() {
  const createEmployee = useCreateEmployee();

  return (
    <Stack gap="lg">
      <Title order={2}>Add employee</Title>
      <EmployeeForm mode="create" onSubmit={(payload) => createEmployee.mutateAsync(payload)} />
    </Stack>
  );
}
