import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { RevisionTimeline } from './RevisionTimeline';
import { api } from '../../../api/client';

vi.mock('../../../api/client', () => ({
  api: { GET: vi.fn() },
}));

const mockedGet = vi.mocked(api.GET);

function mockRevisions(data: unknown) {
  mockedGet.mockResolvedValue({ data, error: undefined, response: new Response() } as never);
}

describe('RevisionTimeline', () => {
  it('renders revisions newest-first, in the order the API returns them', async () => {
    mockRevisions({
      data: [
        {
          id: 'rev_2',
          oldTotalMinor: 12000000,
          newTotalMinor: 13500000,
          currency: 'INR',
          remark: 'Annual increment — FY25 appraisal, 12% raise',
          changedBy: { id: 'usr_1', name: 'Priya Rao' },
          createdAt: '2026-04-01T09:12:00Z',
          componentsSnapshot: [],
        },
        {
          id: 'rev_1',
          oldTotalMinor: null,
          newTotalMinor: 12000000,
          currency: 'INR',
          remark: 'Initial salary',
          changedBy: { id: 'usr_1', name: 'Priya Rao' },
          createdAt: '2025-04-01T09:12:00Z',
          componentsSnapshot: [],
        },
      ],
      total: 2,
      page: 1,
      pageSize: 25,
    });

    renderWithProviders(<RevisionTimeline employeeId="emp_1" />);

    const remarks = await screen.findAllByText(/appraisal|initial salary/i);
    expect(remarks.map((el) => el.textContent)).toEqual([
      'Annual increment — FY25 appraisal, 12% raise',
      'Initial salary',
    ]);
  });

  it('renders the initial revision (oldTotalMinor null) distinctly — no "from" value or arrow', async () => {
    mockRevisions({
      data: [
        {
          id: 'rev_1',
          oldTotalMinor: null,
          newTotalMinor: 12000000,
          currency: 'INR',
          // The backend's SalaryRevision.forInitial always sends this exact
          // remark for the creation revision — the component renders
          // `remark` verbatim, no client-side text substitution.
          remark: 'Initial salary on creation',
          changedBy: { id: 'usr_1', name: 'Priya Rao' },
          createdAt: '2025-04-01T09:12:00Z',
          componentsSnapshot: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    });

    renderWithProviders(<RevisionTimeline employeeId="emp_1" />);

    expect(await screen.findByText('Initial salary on creation')).toBeInTheDocument();
    expect(screen.getByText('₹1,20,000.00')).toBeInTheDocument();
    expect(screen.queryByText('→')).not.toBeInTheDocument();
  });

  it('shows a later revision as old → new, formatted in the revision\'s own currency', async () => {
    mockRevisions({
      data: [
        {
          id: 'rev_2',
          oldTotalMinor: 12000000,
          newTotalMinor: 13500000,
          currency: 'INR',
          remark: 'Annual increment',
          changedBy: { id: 'usr_1', name: 'Priya Rao' },
          createdAt: '2026-04-01T09:12:00Z',
          componentsSnapshot: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    });

    renderWithProviders(<RevisionTimeline employeeId="emp_1" />);

    expect(await screen.findByText('₹1,20,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹1,35,000.00')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('Priya Rao')).toBeInTheDocument();
    expect(screen.getByText('01 Apr 2026')).toBeInTheDocument();
  });
});
