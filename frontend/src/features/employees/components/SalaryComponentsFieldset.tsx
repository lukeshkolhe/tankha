import { Stack, Text, TextInput } from '@mantine/core';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FIXED_SALARY_COMPONENT_TYPES } from '../lib/employee-form-schema';
import type { CreateEmployeeFormValues } from '../lib/employee-form-schema';
import type { SalaryComponentType } from '../lib/salary-conversion';

const COMPONENT_LABELS: Record<SalaryComponentType, string> = {
  BASIC: 'Basic',
  HOUSE_RENT_ALLOWANCE: 'House Rent Allowance',
  SPECIAL_ALLOWANCE: 'Special Allowance',
  TRANSPORT_ALLOWANCE: 'Transport Allowance',
  ANNUAL_BONUS: 'Annual Bonus',
};

export interface SalaryComponentsFieldsetProps {
  register: UseFormRegister<CreateEmployeeFormValues>;
  errors: FieldErrors<CreateEmployeeFormValues>;
}

/**
 * The fixed 5-row salary sub-form (create mode only). Amounts stay in major
 * units here — the values are converted to the API's integer minor units at
 * submit time via `buildSalaryComponentsPayload`, once a currency (and thus
 * `minorUnitDigits`) has been chosen.
 */
export function SalaryComponentsFieldset({ register, errors }: SalaryComponentsFieldsetProps) {
  return (
    <Stack gap="sm">
      <Text fw={600} size="sm">
        Salary components (annual)
      </Text>
      {FIXED_SALARY_COMPONENT_TYPES.map((type, index) => (
        <TextInput
          key={type}
          label={COMPONENT_LABELS[type]}
          inputMode="decimal"
          error={errors.salaryComponents?.[index]?.amountMajor?.message}
          {...register(`salaryComponents.${index}.amountMajor` as const)}
        />
      ))}
    </Stack>
  );
}
