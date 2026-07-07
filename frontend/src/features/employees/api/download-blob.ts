/**
 * Both the sample sheet and the filtered export are streamed as a binary
 * `Blob` (not JSON) — this is the one place that turns a `Blob` into an
 * actual browser download, via a throwaway object URL + anchor click.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
