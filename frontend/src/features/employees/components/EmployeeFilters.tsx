import { Group, Select, TextInput } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useReferenceData } from '../api/useReferenceData';
import { withUpdatedParam } from '../lib/employee-list-params';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * Reads and writes the list page's `search` / `department` / `country` /
 * `status` URL params directly (the URL is the single source of truth for
 * filter state, per the workforce module's convention) — mirrors the proven
 * wiring in `InsightsFilters`, which reads/writes these very same param
 * names so drilling between the two views never describes a different
 * filtered population.
 */
export function EmployeeFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { departments, countries } = useReferenceData();

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
        data={departments.map((department) => ({ value: department.id, label: department.name }))}
        value={searchParams.get('department')}
        onChange={(value) => update('department', value)}
      />
      <Select
        label="Country"
        placeholder="All countries"
        clearable
        data={countries.map((country) => ({ value: country.code, label: country.name }))}
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
