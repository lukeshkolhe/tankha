import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render-with-providers';
import { EditSalaryModal } from './EditSalaryModal';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), PUT: vi.fn() },
}));

const mockedPut = vi.mocked(api.PUT);

const CURRENT_COMPONENTS = [
  { type: 'BASIC' as const, amountMinor: 80000000 },
  { type: 'HOUSE_RENT_ALLOWANCE' as const, amountMinor: 40000000 },
  { type: 'SPECIAL_ALLOWANCE' as const, amountMinor: 15000000 },
  { type: 'TRANSPORT_ALLOWANCE' as const, amountMinor: 5000000 },
  { type: 'ANNUAL_BONUS' as const, amountMinor: 2000000 },
];

function renderModal(onClose = vi.fn()) {
  return renderWithProviders(
    <EditSalaryModal
      employeeId="emp_1"
      currencyCode="INR"
      minorUnitDigits={2}
      currentComponents={CURRENT_COMPONENTS}
      onClose={onClose}
    />,
  );
}

describe('EditSalaryModal', () => {
  it('disables save until a non-blank remark is entered — the appraisal trail can never be skipped', async () => {
    const user = userEvent.setup();
    renderModal();

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    const remarkField = screen.getByLabelText(/remark/i);
    await user.type(remarkField, '   ');
    expect(saveButton).toBeDisabled();

    await user.type(remarkField, 'Annual increment');
    expect(saveButton).toBeEnabled();
  });

  it('live-recomputes the displayed total as a component amount changes, without waiting for a save', async () => {
    const user = userEvent.setup();
    renderModal();

    // Initial total: 8,00,000 + 4,00,000 + 1,50,000 + 50,000 + 20,000 = 14,20,000
    expect(screen.getByText('₹14,20,000.00')).toBeInTheDocument();

    const basicField = screen.getByLabelText('Basic');
    await user.clear(basicField);
    await user.type(basicField, '900000');

    // New total: 9,00,000 + 4,00,000 + 1,50,000 + 50,000 + 20,000 = 15,20,000
    expect(screen.getByText('₹15,20,000.00')).toBeInTheDocument();
  });

  it('submits the edit with minor-unit-converted components and the trimmed remark, and no currency field', async () => {
    mockedPut.mockResolvedValue({
      data: {
        employeeId: 'emp_1',
        currency: 'INR',
        components: CURRENT_COMPONENTS,
        totalMinor: 142000000,
      },
      error: undefined,
      response: new Response(),
    } as never);

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(onClose);

    const basicField = screen.getByLabelText('Basic');
    await user.clear(basicField);
    await user.type(basicField, '900000');

    const remarkField = screen.getByLabelText(/remark/i);
    await user.type(remarkField, 'Annual increment — FY25 appraisal');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockedPut).toHaveBeenCalled());

    const [, requestInit] = mockedPut.mock.calls[0];
    expect(requestInit).toMatchObject({
      params: { path: { employeeId: 'emp_1' } },
      body: {
        remark: 'Annual increment — FY25 appraisal',
        components: [
          { type: 'BASIC', amountMinor: 90000000 },
          { type: 'HOUSE_RENT_ALLOWANCE', amountMinor: 40000000 },
          { type: 'SPECIAL_ALLOWANCE', amountMinor: 15000000 },
          { type: 'TRANSPORT_ALLOWANCE', amountMinor: 5000000 },
          { type: 'ANNUAL_BONUS', amountMinor: 2000000 },
        ],
      },
    });
    expect(requestInit).not.toHaveProperty('body.currency');
  });
});
