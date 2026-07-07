import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render-with-providers';
import { ImportPreviewPanel } from './ImportPreviewPanel';
import type { ImportPreview } from '../api/usePreviewImport';

const PREVIEW: ImportPreview = {
  toInsert: 9800,
  conflicts: [
    {
      rowNumber: 12,
      employeeCode: 'EMP-1042',
      changes: [
        { field: 'designation', current: 'Engineer', incoming: 'Senior Engineer' },
        { field: 'salaryTotal', current: 12000000, incoming: 13500000, currency: 'INR' },
      ],
    },
  ],
  invalid: [
    { rowNumber: 42, employeeCode: 'EMP-1042-DUP', reasons: ['Duplicate employee code within the uploaded file'] },
    { rowNumber: 118, employeeCode: 'EMP-1118', reasons: ["Unknown department 'Enginering'", 'Negative amount for BASIC'] },
  ],
};

describe('ImportPreviewPanel', () => {
  it('renders the will-insert count', () => {
    renderWithProviders(
      <ImportPreviewPanel preview={PREVIEW} selectedCodes={new Set()} onToggleConflict={vi.fn()} />,
    );

    expect(screen.getByText('9800 new employees will be created')).toBeInTheDocument();
  });

  it('renders the conflicts bucket with the money-formatted field diff', () => {
    renderWithProviders(
      <ImportPreviewPanel preview={PREVIEW} selectedCodes={new Set()} onToggleConflict={vi.fn()} />,
    );

    const codeCell = screen.getByText('EMP-1042');
    const row = codeCell.closest('tr');
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain('Engineer');
    expect(row?.textContent).toContain('Senior Engineer');
    expect(row?.textContent).toContain('₹1,20,000.00');
    expect(row?.textContent).toContain('₹1,35,000.00');
  });

  it('renders the rejected bucket with row number, employee code and joined reasons', () => {
    renderWithProviders(
      <ImportPreviewPanel preview={PREVIEW} selectedCodes={new Set()} onToggleConflict={vi.fn()} />,
    );

    expect(screen.getByText('Rejected rows (2)')).toBeInTheDocument();
    expect(screen.getByText('EMP-1042-DUP')).toBeInTheDocument();
    expect(screen.getByText('Duplicate employee code within the uploaded file')).toBeInTheDocument();
    expect(screen.getByText("Unknown department 'Enginering', Negative amount for BASIC")).toBeInTheDocument();
  });

  it('omits the conflicts section entirely when there are none', () => {
    renderWithProviders(
      <ImportPreviewPanel
        preview={{ toInsert: 5, conflicts: [], invalid: [] }}
        selectedCodes={new Set()}
        onToggleConflict={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('conflict-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('invalid-table')).not.toBeInTheDocument();
  });
});
