import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'react-router-dom';
import { renderWithProviders } from '../../../test/render-with-providers';
import { EmployeeTable, type EmployeeTableProps } from './EmployeeTable';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

mockedGet.mockImplementation(async (url: unknown) => {
  if (url === '/api/v1/reference/currencies') {
    return {
      data: [
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
        { code: 'USD', name: 'US Dollar', symbol: '$', minorUnitDigits: 2 },
      ],
      error: undefined,
    } as never;
  }
  return { data: [], error: undefined } as never;
});

function makeRow(overrides: Partial<EmployeeTableProps['rows'][number]> = {}) {
  return {
    id: 'emp_1',
    employeeCode: 'EMP-1001',
    firstName: 'Ravi',
    lastName: 'Kumar',
    department: 'Engineering',
    designation: 'Senior Engineer',
    country: 'IN',
    currency: 'INR',
    status: 'ACTIVE' as const,
    joinDate: '2021-04-01',
    salaryTotalMinor: 800000,
    ...overrides,
  };
}

function LocationProbe() {
  const [searchParams] = useSearchParams();
  return <div data-testid="location-probe">{searchParams.toString()}</div>;
}

describe('EmployeeTable', () => {
  it("formats each row's salary using that row's own currency and minorUnitDigits", async () => {
    renderWithProviders(
      <EmployeeTable
        rows={[
          makeRow({ id: 'emp_1', currency: 'INR', salaryTotalMinor: 800000 }),
          makeRow({ id: 'emp_2', employeeCode: 'EMP-1002', currency: 'USD', salaryTotalMinor: 500000 }),
        ]}
        total={2}
        page={1}
        pageSize={25}
      />,
    );

    expect(await screen.findByText('₹8,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('renders "—" instead of crashing or showing NaN when salaryTotalMinor is null', async () => {
    renderWithProviders(
      <EmployeeTable rows={[makeRow({ salaryTotalMinor: null })]} total={1} page={1} pageSize={25} />,
    );

    expect(await screen.findByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('shows an Active badge for an ACTIVE row and an Inactive badge for an INACTIVE row', async () => {
    renderWithProviders(
      <EmployeeTable
        rows={[
          makeRow({ id: 'emp_1', status: 'ACTIVE' }),
          makeRow({ id: 'emp_2', employeeCode: 'EMP-1002', status: 'INACTIVE' }),
        ]}
        total={2}
        page={1}
        pageSize={25}
      />,
    );

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it("links each row's name to that employee's detail page", async () => {
    renderWithProviders(<EmployeeTable rows={[makeRow()]} total={1} page={1} pageSize={25} />);

    const link = await screen.findByRole('link', { name: 'Ravi Kumar' });
    expect(link).toHaveAttribute('href', '/employees/emp_1');
  });

  it('changing the page via Pagination updates the `page` URL param without clobbering other params', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <EmployeeTable rows={[makeRow()]} total={60} page={1} pageSize={25} />
        <LocationProbe />
      </>,
      { initialEntries: ['/employees?search=ravi&page=1'] },
    );

    const pageTwoButton = await screen.findByRole('button', { name: '2' });
    await user.click(pageTwoButton);

    const params = new URLSearchParams(screen.getByTestId('location-probe').textContent ?? '');
    expect(params.get('page')).toBe('2');
    expect(params.get('search')).toBe('ravi');
  });
});
