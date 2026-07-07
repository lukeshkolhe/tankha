import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { formatDate } from '../../../lib/format-date';
import { useEmployee, useDeactivateEmployee, useReactivateEmployee } from '../api/useEmployee';
import { SalaryBreakdownCard } from '../../compensation/components/SalaryBreakdownCard';
import { RevisionTimeline } from '../../compensation/components/RevisionTimeline';

/**
 * Attributes + current pay + full change history in one page (per
 * architecture.md §02-workforce, §03-compensation). Compensation renders
 * inside this page — there is no standalone salary route.
 */
export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ?? '';
  const employee = useEmployee(employeeId);
  const deactivate = useDeactivateEmployee(employeeId);
  const reactivate = useReactivateEmployee(employeeId);

  if (employee.isPending) {
    return <Loader />;
  }
  if (employee.isError || !employee.data) {
    return <Alert color="red">Could not load this employee.</Alert>;
  }

  const { data } = employee;
  const isActive = data.status === 'ACTIVE';

  return (
    <Stack gap="lg">
      <Button component={Link} to="/employees" variant="subtle" size="xs" w="fit-content">
        ← Employees
      </Button>

      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>
            {data.firstName} {data.lastName}
          </Title>
          <Group gap={6} mt={4}>
            <Text c="dimmed" size="sm">
              {data.employeeCode}
            </Text>
            <Text c="dimmed" size="sm">
              ·
            </Text>
            <Text c="dimmed" size="sm">
              {data.department.name} · {data.designation.name}
            </Text>
            <Text c="dimmed" size="sm">
              ·
            </Text>
            <Text c="dimmed" size="sm">
              Joined {formatDate(data.joinDate)}
            </Text>
            <Badge color={isActive ? 'verdigris' : 'gray'} variant="light">
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Group>
        </div>
        <Group>
          <Button component={Link} to={`/employees/${employeeId}/edit`} variant="default">
            Edit details
          </Button>
          {isActive ? (
            <Button
              color="red"
              variant="outline"
              loading={deactivate.isPending}
              onClick={() => deactivate.mutate()}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              color="verdigris"
              variant="outline"
              loading={reactivate.isPending}
              onClick={() => reactivate.mutate()}
            >
              Reactivate
            </Button>
          )}
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder padding="lg" radius="md">
            <Text fw={600} size="lg" mb="md">
              Attributes
            </Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Employee code
                </Text>
                <Text size="sm">{data.employeeCode}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Department
                </Text>
                <Text size="sm">{data.department.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Designation
                </Text>
                <Text size="sm">{data.designation.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Country
                </Text>
                <Text size="sm">{data.countryCode}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Currency
                </Text>
                <Text size="sm">{data.currencyCode}</Text>
              </Group>
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Join date
                </Text>
                <Text size="sm">{formatDate(data.joinDate)}</Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <SalaryBreakdownCard employeeId={employeeId} currencyCode={data.currencyCode} />
        </Grid.Col>
      </Grid>

      <div>
        <Text fw={600} size="lg" mb="sm">
          Compensation history
        </Text>
        <RevisionTimeline employeeId={employeeId} />
      </div>
    </Stack>
  );
}

