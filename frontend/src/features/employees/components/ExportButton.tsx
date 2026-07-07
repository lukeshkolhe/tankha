import { Button } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { parseEmployeeListQuery } from '../lib/employee-list-params';
import { useExportEmployees, type ExportFilters } from '../api/useExportEmployees';

/**
 * Reuses the list page's own param parser (`parseEmployeeListQuery`) so the
 * export can never drift from the list's filter semantics — same whitelist,
 * same empty-string handling, same status enum guard — just dropping the two
 * pagination keys the export endpoint doesn't accept (it always exports the
 * whole filtered set).
 */
export function filtersFromSearchParams(searchParams: URLSearchParams): ExportFilters {
  const { page, pageSize, ...filters } = parseEmployeeListQuery(searchParams);
  return filters;
}

export interface ExportButtonProps {
  /** Defaults to xlsx; pass 'csv' for a plain-text export. */
  format?: 'xlsx' | 'csv';
}

/** Exports exactly the current filtered/searched employee list (FR-4.3). */
export function ExportButton({ format = 'xlsx' }: ExportButtonProps) {
  const [searchParams] = useSearchParams();
  const { download, isDownloading } = useExportEmployees();

  function handleClick() {
    void download(filtersFromSearchParams(searchParams), format);
  }

  return (
    <Button variant="default" onClick={handleClick} loading={isDownloading}>
      Export
    </Button>
  );
}
