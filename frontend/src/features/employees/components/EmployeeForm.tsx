import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Stack } from '@mantine/core';
import { useReferenceData } from '../api/useReferenceData';
import {
  createEmployeeFormSchema,
  defaultSalaryComponents,
  employeeAttributesSchema,
  type CreateEmployeeFormValues,
  type EmployeeAttributesFormValues,
} from '../lib/employee-form-schema';
import { buildSalaryComponentsPayload } from '../lib/salary-conversion';
import { extractFieldErrors } from '../lib/api-error';
import { EmployeeAttributesFieldset } from './EmployeeAttributesFieldset';
import { SalaryComponentsFieldset } from './SalaryComponentsFieldset';
import type { CreateEmployeeDto } from '../api/useCreateEmployee';
import type { UpdateEmployeeDto } from '../api/useUpdateEmployee';

const EMPTY_ATTRIBUTES: EmployeeAttributesFormValues = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  departmentId: '',
  designationId: '',
  countryCode: '',
  currencyCode: '',
  joinDate: '',
};

interface CreateModeProps {
  mode: 'create';
  onSubmit: (payload: CreateEmployeeDto) => Promise<unknown>;
}

interface EditModeProps {
  mode: 'edit';
  defaultValues: EmployeeAttributesFormValues;
  onSubmit: (payload: UpdateEmployeeDto) => Promise<unknown>;
}

export type EmployeeFormProps = CreateModeProps | EditModeProps;

/**
 * One form value shape (`CreateEmployeeFormValues`) backs both modes since
 * `employeeAttributesSchema` is a strict subset of `createEmployeeFormSchema`
 * — edit mode simply never renders or reads the salary rows. The zod
 * resolver still switches per mode so edit-mode validation never requires
 * salary data; the cast reflects that `employeeAttributesSchema`'s inferred
 * type is that subset, not a mismatch in practice.
 */
export function EmployeeForm(props: EmployeeFormProps) {
  const { mode } = props;
  const { departments, designations, countries, currencies } = useReferenceData();

  const resolver = zodResolver(
    mode === 'create' ? createEmployeeFormSchema : employeeAttributesSchema,
  ) as unknown as Resolver<CreateEmployeeFormValues>;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormValues>({
    resolver,
    defaultValues: {
      ...(mode === 'edit' ? props.defaultValues : EMPTY_ATTRIBUTES),
      salaryComponents: defaultSalaryComponents(),
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      if (props.mode === 'create') {
        const minorUnitDigits =
          currencies.find((currency) => currency.code === values.currencyCode)?.minorUnitDigits ?? 2;
        const payload: CreateEmployeeDto = {
          employeeCode: values.employeeCode,
          firstName: values.firstName,
          lastName: values.lastName,
          departmentId: values.departmentId,
          designationId: values.designationId,
          countryCode: values.countryCode,
          currencyCode: values.currencyCode,
          joinDate: values.joinDate,
          salary: { components: buildSalaryComponentsPayload(values.salaryComponents, minorUnitDigits) },
        };
        await props.onSubmit(payload);
      } else {
        const payload: UpdateEmployeeDto = {
          employeeCode: values.employeeCode,
          firstName: values.firstName,
          lastName: values.lastName,
          departmentId: values.departmentId,
          designationId: values.designationId,
          countryCode: values.countryCode,
          currencyCode: values.currencyCode,
          joinDate: values.joinDate,
        };
        await props.onSubmit(payload);
      }
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      for (const [field, message] of Object.entries(fieldErrors)) {
        setError(field as keyof CreateEmployeeFormValues, { message });
      }
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <EmployeeAttributesFieldset
          register={register}
          control={control}
          errors={errors}
          departments={departments}
          designations={designations}
          countries={countries}
          currencies={currencies}
        />
        {mode === 'create' && <SalaryComponentsFieldset register={register} errors={errors} />}
        <Group justify="flex-end">
          <Button type="submit" loading={isSubmitting}>
            {mode === 'create' ? 'Create employee' : 'Save changes'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
