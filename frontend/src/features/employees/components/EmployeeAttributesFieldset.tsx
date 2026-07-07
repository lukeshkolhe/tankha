import { Grid, Select, TextInput } from '@mantine/core';
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import type { components } from '../../../api/schema';
import type { CreateEmployeeFormValues } from '../lib/employee-form-schema';

type ReferenceItemDto = components['schemas']['ReferenceItemDto'];
type CountryItemDto = components['schemas']['CountryItemDto'];
type CurrencyItemDto = components['schemas']['CurrencyItemDto'];

export interface EmployeeAttributesFieldsetProps {
  register: UseFormRegister<CreateEmployeeFormValues>;
  control: Control<CreateEmployeeFormValues>;
  errors: FieldErrors<CreateEmployeeFormValues>;
  departments: ReferenceItemDto[];
  designations: ReferenceItemDto[];
  countries: CountryItemDto[];
  currencies: CurrencyItemDto[];
}

/**
 * The 8 core attribute fields shared by create and edit mode (per
 * `employeeAttributesSchema`). Selects are wired via `Controller` since
 * Mantine's `Select` isn't a native input `register` can attach to directly.
 */
export function EmployeeAttributesFieldset({
  register,
  control,
  errors,
  departments,
  designations,
  countries,
  currencies,
}: EmployeeAttributesFieldsetProps) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <TextInput
          label="Employee code"
          error={errors.employeeCode?.message}
          {...register('employeeCode')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <TextInput
          label="Join date"
          type="date"
          error={errors.joinDate?.message}
          {...register('joinDate')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <TextInput label="First name" error={errors.firstName?.message} {...register('firstName')} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <TextInput label="Last name" error={errors.lastName?.message} {...register('lastName')} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <Select
              label="Department"
              placeholder="Select department"
              data={departments.map((department) => ({ value: department.id, label: department.name }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.departmentId?.message}
            />
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Controller
          control={control}
          name="designationId"
          render={({ field }) => (
            <Select
              label="Designation"
              placeholder="Select designation"
              data={designations.map((designation) => ({
                value: designation.id,
                label: designation.name,
              }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.designationId?.message}
            />
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Controller
          control={control}
          name="countryCode"
          render={({ field }) => (
            <Select
              label="Country"
              placeholder="Select country"
              data={countries.map((country) => ({ value: country.code, label: country.name }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.countryCode?.message}
            />
          )}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Controller
          control={control}
          name="currencyCode"
          render={({ field }) => (
            <Select
              label="Currency"
              placeholder="Select currency"
              data={currencies.map((currency) => ({
                value: currency.code,
                label: `${currency.code} — ${currency.name}`,
              }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.currencyCode?.message}
            />
          )}
        />
      </Grid.Col>
    </Grid>
  );
}
