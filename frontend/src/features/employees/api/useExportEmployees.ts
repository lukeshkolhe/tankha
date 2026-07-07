import { useCallback, useState } from 'react';
import { api } from '../../../api/client';
import type { EmployeeListQuery } from '../lib/employee-list-params';
import { triggerBrowserDownload } from './download-blob';
import type { SheetFormat } from './useSampleSheet';

/**
 * The export endpoint takes the same filter/search/sort params as the
 * employee list, minus pagination — it always exports the whole filtered
 * set, never a single page.
 */
export type ExportFilters = Omit<EmployeeListQuery, 'page' | 'pageSize'>;

/**
 * Downloads the current filtered/searched employee list — GET
 * /employees/export. Reuses the list's own query shape so "export" can never
 * drift from "what HR is currently looking at".
 */
export function useExportEmployees() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async (filters: ExportFilters, format: SheetFormat) => {
    setIsDownloading(true);
    try {
      const { data, error } = await api.GET('/api/v1/employees/export', {
        params: { query: { ...filters, format } },
        parseAs: 'blob',
      });
      if (error) {
        throw error;
      }
      triggerBrowserDownload(data as Blob, `tankha-employees.${format}`);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { download, isDownloading };
}
