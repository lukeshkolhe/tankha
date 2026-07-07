import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { ImportResultPanel } from './ImportResultPanel';
import type { ImportReport } from '../api/useCommitImport';

describe('ImportResultPanel', () => {
  it('renders inserted, updated, skippedConflicts and failed counts', () => {
    const report: ImportReport = { inserted: 9800, updated: 1, skippedConflicts: 2, failed: [] };

    renderWithProviders(<ImportResultPanel report={report} />);

    // Each count and its label render as sibling text nodes in one element
    // ("9800 inserted"), so match the combined text rather than each half.
    expect(screen.getByText('9800 inserted')).toBeInTheDocument();
    expect(screen.getByText('1 updated')).toBeInTheDocument();
    expect(screen.getByText('2 skipped conflicts')).toBeInTheDocument();
  });

  it('lists failed rows with their row number, employee code and joined reasons', () => {
    const report: ImportReport = {
      inserted: 0,
      updated: 0,
      skippedConflicts: 0,
      failed: [
        { rowNumber: 42, employeeCode: 'EMP-1042-DUP', reasons: ['Duplicate employee code within the uploaded file'] },
        { rowNumber: 118, reasons: ["Unknown department 'Enginering'"] },
      ],
    };

    renderWithProviders(<ImportResultPanel report={report} />);

    expect(screen.getByText('EMP-1042-DUP')).toBeInTheDocument();
    expect(screen.getByText('Duplicate employee code within the uploaded file')).toBeInTheDocument();
    expect(screen.getByText("Unknown department 'Enginering'")).toBeInTheDocument();
    expect(screen.getByText('118')).toBeInTheDocument();
  });

  it('omits the failed table when there are no failed rows', () => {
    const report: ImportReport = { inserted: 5, updated: 0, skippedConflicts: 0, failed: [] };

    renderWithProviders(<ImportResultPanel report={report} />);

    expect(screen.queryByTestId('failed-table')).not.toBeInTheDocument();
  });
});
