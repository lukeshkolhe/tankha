import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Group, Modal, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { useEditSalary } from '../api/useEditSalary';
import {
  SALARY_COMPONENT_LABELS,
  SALARY_COMPONENT_TYPES,
  computeTotalMinor,
  toMinorUnits,
  type SalaryComponentType,
} from '../lib/salary-math';
import { formatMoney, toMajorUnits } from '../../../lib/money';
import type { components } from '../../../api/schema';

type SalaryComponentDto = components['schemas']['SalaryComponentDto'];

interface EditSalaryModalProps {
  employeeId: string;
  currencyCode: string;
  minorUnitDigits: number;
  currentComponents: SalaryComponentDto[];
  onClose: () => void;
}

type EditSalaryFormValues = Record<SalaryComponentType, string> & { remark: string };

const amountField = z
  .string()
  .refine((value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: 'Enter a non-negative amount',
  });

const editSalarySchema = z.object({
  BASIC: amountField,
  HOUSE_RENT_ALLOWANCE: amountField,
  SPECIAL_ALLOWANCE: amountField,
  TRANSPORT_ALLOWANCE: amountField,
  ANNUAL_BONUS: amountField,
  remark: z.string(),
});

function defaultAmountsFrom(
  currentComponents: SalaryComponentDto[],
  minorUnitDigits: number,
): Record<SalaryComponentType, string> {
  const amounts = {} as Record<SalaryComponentType, string>;
  for (const type of SALARY_COMPONENT_TYPES) {
    const amountMinor = currentComponents.find((component) => component.type === type)?.amountMinor ?? 0;
    amounts[type] = String(toMajorUnits(amountMinor, minorUnitDigits));
  }
  return amounts;
}

/**
 * The salary edit form: five fixed-component amount fields plus a required
 * remark. The total shown here is a client-side mirror recomputed live from
 * the fields, purely for feedback — the server recomputes and persists the
 * authoritative total. Save stays disabled while the remark is blank so the
 * appraisal trail can never be skipped.
 */
export function EditSalaryModal({
  employeeId,
  currencyCode,
  minorUnitDigits,
  currentComponents,
  onClose,
}: EditSalaryModalProps) {
  const editSalary = useEditSalary(employeeId);
  const { register, handleSubmit, watch, formState } = useForm<EditSalaryFormValues>({
    resolver: zodResolver(editSalarySchema),
    defaultValues: { ...defaultAmountsFrom(currentComponents, minorUnitDigits), remark: '' },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const isRemarkBlank = (watchedValues.remark ?? '').trim().length === 0;
  const liveTotalMinor = computeTotalMinor(
    SALARY_COMPONENT_TYPES.map((type) => toMinorUnits(watchedValues[type] ?? '', minorUnitDigits)),
  );

  const onSubmit = handleSubmit((values) => {
    const trimmedRemark = values.remark.trim();
    if (trimmedRemark === '') {
      return;
    }
    const editedComponents: SalaryComponentDto[] = SALARY_COMPONENT_TYPES.map((type) => ({
      type,
      amountMinor: toMinorUnits(values[type], minorUnitDigits),
    }));
    editSalary.mutate({ components: editedComponents, remark: trimmedRemark }, { onSuccess: onClose });
  });

  return (
    <Modal opened onClose={onClose} title="Edit salary" size="md">
      <form onSubmit={onSubmit}>
        <Stack gap="sm">
          {SALARY_COMPONENT_TYPES.map((type) => (
            <TextInput
              key={type}
              label={SALARY_COMPONENT_LABELS[type]}
              inputMode="decimal"
              error={formState.errors[type]?.message}
              {...register(type)}
            />
          ))}

          <Group
            justify="space-between"
            pt="xs"
            style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
          >
            <Text fw={600}>Live total</Text>
            <Text fw={600}>{formatMoney(liveTotalMinor, currencyCode, minorUnitDigits)}</Text>
          </Group>

          <Textarea
            label="Remark"
            description="Required — the reason for this change becomes part of the appraisal record."
            minRows={2}
            {...register('remark')}
          />

          {editSalary.isError && <Alert color="red">Could not save the salary change.</Alert>}

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isRemarkBlank || editSalary.isPending} loading={editSalary.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
