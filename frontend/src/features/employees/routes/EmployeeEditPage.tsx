import { useParams } from 'react-router-dom';
import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEmployee } from '../api/useEmployee';
import { useUpdateEmployee } from '../api/useUpdateEmployee';
import { EmployeeForm } from '../components/EmployeeForm';

/** Edit-employee page: attrs only, never salary (per `useUpdateEmployee`'s contract). */
export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ?? '';
  const employee = useEmployee(employeeId);
  const updateEmployee = useUpdateEmployee(employeeId);

  if (employee.isPending) {
    return <Loader />;
  }
  if (employee.isError || !employee.data) {
    return <Alert color="red">Could not load this employee.</Alert>;
  }

  const { data } = employee;

  return (
    <Stack gap="lg">
      <Title order={2}>Edit employee</Title>
      <EmployeeForm
        mode="edit"
        defaultValues={{
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: data.department.id,
          designationId: data.designation.id,
          countryCode: data.countryCode,
          currencyCode: data.currencyCode,
          joinDate: data.joinDate,
        }}
        onSubmit={(payload) => updateEmployee.mutateAsync(payload)}
      />
    </Stack>
  );
}
