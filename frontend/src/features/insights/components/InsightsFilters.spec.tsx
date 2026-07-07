import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'react-router-dom';
import { renderWithProviders } from '../../../test/render-with-providers';
import { InsightsFilters } from './InsightsFilters';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

mockedGet.mockImplementation(async (url: unknown) => {
  if (url === '/api/v1/reference/departments') {
    return { data: [{ id: 'dept_1', name: 'Engineering' }], error: undefined } as never;
  }
  if (url === '/api/v1/reference/countries') {
    return { data: [{ code: 'IN', name: 'India' }], error: undefined } as never;
  }
  return { data: undefined, error: undefined } as never;
});

/** Renders the current URL search-param string alongside the filters, so tests can assert on it. */
function LocationProbe() {
  const [searchParams] = useSearchParams();
  return <div data-testid="location-probe">{searchParams.toString()}</div>;
}

function renderFilters(initialEntry: string) {
  return renderWithProviders(
    <>
      <InsightsFilters />
      <LocationProbe />
    </>,
    { initialEntries: [initialEntry] },
  );
}

function probeParams(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId('location-probe').textContent ?? '');
}

describe('InsightsFilters', () => {
  it('typing in search updates the `search` URL param without clobbering existing params', async () => {
    const user = userEvent.setup();
    renderFilters('/dashboard?status=ACTIVE&country=IN');

    const searchInput = screen.getByLabelText('Search');
    await user.type(searchInput, 'priya');

    const params = probeParams();
    expect(params.get('search')).toBe('priya');
    expect(params.get('status')).toBe('ACTIVE');
    expect(params.get('country')).toBe('IN');
  });

  it('changing the status filter updates `status` without clobbering the other params', async () => {
    const user = userEvent.setup();
    renderFilters('/dashboard?search=priya&department=dept_1');

    // Mantine's Select associates its aria-labelledby with both the visible
    // input AND the (present-but-hidden) options listbox, so getByLabelText
    // is ambiguous; getByRole('textbox', ...) matches only the real input.
    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    await user.click(statusInput);
    await user.click(await screen.findByRole('option', { name: 'Inactive' }));

    const params = probeParams();
    expect(params.get('status')).toBe('INACTIVE');
    expect(params.get('search')).toBe('priya');
    expect(params.get('department')).toBe('dept_1');
  });

  it('changing the department filter (fed by reference data) updates `department` without clobbering the others', async () => {
    const user = userEvent.setup();
    renderFilters('/dashboard?search=priya&status=ACTIVE');

    const departmentInput = screen.getByRole('textbox', { name: 'Department' });
    await user.click(departmentInput);
    await user.click(await screen.findByRole('option', { name: 'Engineering' }));

    const params = probeParams();
    expect(params.get('department')).toBe('dept_1');
    expect(params.get('search')).toBe('priya');
    expect(params.get('status')).toBe('ACTIVE');
  });

  it('pre-fills each control from the existing URL params', async () => {
    renderFilters('/dashboard?search=priya&status=ACTIVE');

    expect(screen.getByLabelText('Search')).toHaveValue('priya');
    expect(await screen.findByRole('textbox', { name: 'Status' })).toHaveValue('Active');
  });
});
