import { z } from 'zod';
import type { SalaryComponentFormValue, SalaryComponentType } from './salary-conversion';

/**
 * The fixed 5-row salary sub-form, in the order the create form always
 * displays them (per `02-workforce.md` §3 — create-only, attrs-only on edit).
 */
export const FIXED_SALARY_COMPONENT_TYPES: readonly SalaryComponentType[] = [
  'BASIC',
  'HOUSE_RENT_ALLOWANCE',
  'SPECIAL_ALLOWANCE',
  'TRANSPORT_ALLOWANCE',
  'ANNUAL_BONUS',
];

export function defaultSalaryComponents(): SalaryComponentFormValue[] {
  return FIXED_SALARY_COMPONENT_TYPES.map((type) => ({ type, amountMajor: '0' }));
}

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`);

/** Mirrors the attribute fields shared by `CreateEmployeeDto` and `UpdateEmployeeDto`. */
export const employeeAttributesSchema = z.object({
  employeeCode: requiredText('Employee code'),
  firstName: requiredText('First name'),
  lastName: requiredText('Last name'),
  departmentId: requiredText('Department'),
  designationId: requiredText('Designation'),
  countryCode: requiredText('Country'),
  currencyCode: requiredText('Currency'),
  joinDate: requiredText('Join date'),
});

export type EmployeeAttributesFormValues = z.infer<typeof employeeAttributesSchema>;

const salaryComponentRowSchema = z.object({
  type: z.enum([
    'BASIC',
    'HOUSE_RENT_ALLOWANCE',
    'SPECIAL_ALLOWANCE',
    'TRANSPORT_ALLOWANCE',
    'ANNUAL_BONUS',
  ]),
  amountMajor: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((value) => Number.isFinite(Number(value)), 'Enter a valid amount')
    .refine((value) => Number(value) >= 0, 'Amount must be zero or greater'),
});

/** Mirrors `CreateEmployeeDto`: core attributes + the fixed 5-row salary sub-form. */
export const createEmployeeFormSchema = employeeAttributesSchema.extend({
  salaryComponents: z.array(salaryComponentRowSchema).length(5),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeFormSchema>;
