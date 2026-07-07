import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render-with-providers';
import { ConflictTable, formatFieldChange } from './ConflictTable';
import type { ConflictRow } from '../api/usePreviewImport';

const CONFLICTS: ConflictRow[] = [
  {
    rowNumber: 12,
    employeeCode: 'EMP-1042',
    changes: [
      { field: 'designation', current: 'Engineer', incoming: 'Senior Engineer' },
      { field: 'salaryTotal', current: 12000000, incoming: 13500000, currency: 'INR' },
    ],
  },
  {
    rowNumber: 30,
    employeeCode: 'EMP-2001',
    changes: [{ field: 'department', current: 'Sales', incoming: 'Marketing' }],
  },
];

describe('formatFieldChange', () => {
  it('formats a money field through formatMoney when currency is present', () => {
    const result = formatFieldChange({
      field: 'salaryTotal',
      current: 12000000,
      incoming: 13500000,
      currency: 'INR',
    });

    expect(result).toEqual({ current: '₹1,20,000.00', incoming: '₹1,35,000.00' });
  });

  it('renders a non-money field diff as plain text when currency is absent', () => {
    const result = formatFieldChange({
      field: 'designation',
      current: 'Engineer',
      incoming: 'Senior Engineer',
    });

    expect(result).toEqual({ current: 'Engineer', incoming: 'Senior Engineer' });
  });
});

describe('ConflictTable', () => {
  it('renders one row per conflict with a default-unchecked checkbox', () => {
    renderWithProviders(
      <ConflictTable conflicts={CONFLICTS} selectedCodes={new Set()} onToggle={vi.fn()} />,
    );

    expect(screen.getByText('EMP-1042')).toBeInTheDocument();
    expect(screen.getByText('EMP-2001')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      expect(checkbox).not.toBeChecked();
    }
  });

  it('toggling one row calls onToggle with only that row employeeCode', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithProviders(
      <ConflictTable conflicts={CONFLICTS} selectedCodes={new Set()} onToggle={onToggle} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Apply changes for EMP-1042' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('EMP-1042');
  });

  it('reflects selectedCodes so a ticked conflict renders checked and others stay unchecked', () => {
    renderWithProviders(
      <ConflictTable conflicts={CONFLICTS} selectedCodes={new Set(['EMP-1042'])} onToggle={vi.fn()} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Apply changes for EMP-1042' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Apply changes for EMP-2001' })).not.toBeChecked();
  });
});
