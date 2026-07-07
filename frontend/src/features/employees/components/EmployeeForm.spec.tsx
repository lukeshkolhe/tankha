import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render-with-providers';
import { EmployeeForm } from './EmployeeForm';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

mockedGet.mockImplementation(async (url: unknown) => {
  if (url === '/api/v1/reference/departments') {
    return { data: [{ id: 'dep_1', name: 'Engineering' }], error: undefined } as never;
  }
  if (url === '/api/v1/reference/designations') {
    return { data: [{ id: 'des_1', name: 'Senior Engineer' }], error: undefined } as never;
  }
  if (url === '/api/v1/reference/countries') {
    return { data: [{ code: 'IN', name: 'India' }], error: undefined } as never;
  }
  if (url === '/api/v1/reference/currencies') {
    return {
      data: [{ code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 }],
      error: undefined,
    } as never;
  }
  return { data: [], error: undefined } as never;
});

/** Fills every attribute field, including the three reference-data selects. */
async function fillAttributes(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Employee code'), 'EMP-2001');
  await user.type(screen.getByLabelText('First name'), 'Asha');
  await user.type(screen.getByLabelText('Last name'), 'Rao');
  fireEvent.change(screen.getByLabelText('Join date'), { target: { value: '2022-01-15' } });

  await user.click(screen.getByRole('textbox', { name: 'Department' }));
  await user.click(await screen.findByRole('option', { name: 'Engineering' }));

  await user.click(screen.getByRole('textbox', { name: 'Designation' }));
  await user.click(await screen.findByRole('option', { name: 'Senior Engineer' }));

  await user.click(screen.getByRole('textbox', { name: 'Country' }));
  await user.click(await screen.findByRole('option', { name: 'India' }));

  await user.click(screen.getByRole('textbox', { name: 'Currency' }));
  await user.click(await screen.findByRole('option', { name: 'INR — Indian Rupee' }));
}

describe('EmployeeForm (create mode)', () => {
  it('blocks submit and shows a validation error when a required field is left blank', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm mode="create" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create employee' }));

    expect(await screen.findByText('Employee code is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a correctly-shaped CreateEmployeeDto with minor-unit-converted salary components', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm mode="create" onSubmit={onSubmit} />);

    await fillAttributes(user);

    const basicInput = screen.getByLabelText('Basic');
    await user.clear(basicInput);
    await user.type(basicInput, '1000');

    await user.click(screen.getByRole('button', { name: 'Create employee' }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      employeeCode: 'EMP-2001',
      firstName: 'Asha',
      lastName: 'Rao',
      departmentId: 'dep_1',
      designationId: 'des_1',
      countryCode: 'IN',
      currencyCode: 'INR',
      joinDate: '2022-01-15',
      salary: {
        components: [
          { type: 'BASIC', amountMinor: 100000 },
          { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 0 },
          { type: 'SPECIAL_ALLOWANCE', amountMinor: 0 },
          { type: 'TRANSPORT_ALLOWANCE', amountMinor: 0 },
          { type: 'ANNUAL_BONUS', amountMinor: 0 },
        ],
      },
    });
  });

  it('maps a 409 duplicate-employeeCode error onto the employee code field', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue({ message: 'Conflict', details: [{ field: 'employeeCode', reason: 'duplicate' }] });
    const user = userEvent.setup();
    renderWithProviders(<EmployeeForm mode="create" onSubmit={onSubmit} />);

    await fillAttributes(user);
    await user.click(screen.getByRole('button', { name: 'Create employee' }));

    expect(await screen.findByText('This employee code is already in use.')).toBeInTheDocument();
  });
});

describe('EmployeeForm (edit mode)', () => {
  const existingAttributes = {
    employeeCode: 'EMP-1001',
    firstName: 'Priya',
    lastName: 'Sharma',
    departmentId: 'dep_1',
    designationId: 'des_1',
    countryCode: 'IN',
    currencyCode: 'INR',
    joinDate: '2020-06-01',
  };

  it('pre-fills every field from the existing employee attributes', async () => {
    renderWithProviders(
      <EmployeeForm mode="edit" defaultValues={existingAttributes} onSubmit={vi.fn()} />,
    );

    expect(screen.getByLabelText('Employee code')).toHaveValue('EMP-1001');
    expect(screen.getByLabelText('First name')).toHaveValue('Priya');
    expect(screen.getByLabelText('Last name')).toHaveValue('Sharma');
    expect(screen.getByLabelText('Join date')).toHaveValue('2020-06-01');
    // The department/currency Selects only resolve their display label once
    // the (async) reference-data query populates `data`, so these assertions
    // must retry rather than check immediately after render.
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Department' })).toHaveValue('Engineering'),
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Currency' })).toHaveValue('INR — Indian Rupee'),
    );
  });

  it('does not render any salary fields', async () => {
    renderWithProviders(
      <EmployeeForm mode="edit" defaultValues={existingAttributes} onSubmit={vi.fn()} />,
    );

    await screen.findByLabelText('Employee code');
    expect(screen.queryByLabelText('Basic')).not.toBeInTheDocument();
    expect(screen.queryByText('Salary components (annual)')).not.toBeInTheDocument();
  });

  it('submits an UpdateEmployeeDto (no salary) with the edited field on save', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(
      <EmployeeForm mode="edit" defaultValues={existingAttributes} onSubmit={onSubmit} />,
    );

    const lastNameInput = screen.getByLabelText('Last name');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Verma');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      ...existingAttributes,
      lastName: 'Verma',
    });
  });
});
