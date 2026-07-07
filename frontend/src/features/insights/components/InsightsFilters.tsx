import { Group, Select, TextInput } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useCountries, useDepartments } from '../api/useReferenceLists';
import { withUpdatedParam } from '../lib/insights-query-params';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * Reads and writes the SAME `search` / `department` / `country` / `status`
 * URL params the employee list uses (FR-5.3) — so drilling into one view and
 * checking the other always describes the same filtered population.
 */
export function InsightsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const departments = useDepartments();
  const countries = useCountries();

  function update(key: string, value: string | null) {
    setSearchParams(withUpdatedParam(searchParams, key, value));
  }

  return (
    <Group align="flex-end" gap="md" wrap="wrap">
      <TextInput
        label="Search"
        placeholder="Name or employee code"
        value={searchParams.get('search') ?? ''}
        onChange={(event) => update('search', event.currentTarget.value)}
      />
      <Select
        label="Department"
        placeholder="All departments"
        clearable
        data={(departments.data ?? []).map((department) => ({
          value: department.id,
          label: department.name,
        }))}
        value={searchParams.get('department')}
        onChange={(value) => update('department', value)}
      />
      <Select
        label="Country"
        placeholder="All countries"
        clearable
        data={(countries.data ?? []).map((country) => ({ value: country.code, label: country.name }))}
        value={searchParams.get('country')}
        onChange={(value) => update('country', value)}
      />
      <Select
        label="Status"
        placeholder="All statuses"
        clearable
        data={STATUS_OPTIONS}
        value={searchParams.get('status')}
        onChange={(value) => update('status', value)}
      />
    </Group>
  );
}
