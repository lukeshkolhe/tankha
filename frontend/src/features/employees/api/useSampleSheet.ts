import { useCallback, useState } from 'react';
import { api } from '../../../api/client';
import { triggerBrowserDownload } from './download-blob';

export type SheetFormat = 'xlsx' | 'csv';

/**
 * Downloads the pre-filled, importable template — GET /employees/sample-sheet.
 * A download trigger rather than a `useQuery`: there's nothing to cache or
 * re-render from, just a one-shot side effect the caller fires on click.
 */
export function useSampleSheet() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async (format: SheetFormat) => {
    setIsDownloading(true);
    try {
      const { data, error } = await api.GET('/api/v1/employees/sample-sheet', {
        params: { query: { format } },
        parseAs: 'blob',
      });
      if (error) {
        throw error;
      }
      triggerBrowserDownload(data as Blob, `tankha-sample.${format}`);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { download, isDownloading };
}
