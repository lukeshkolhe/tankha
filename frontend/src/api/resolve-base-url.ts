/**
 * Every generated path key already carries the backend's `/api/v1` global
 * prefix (baked into the OpenAPI spec from the running Nest app), so a
 * configured base URL must not repeat it — a trailing `/api/v1` here has
 * caused a real double-prefixed `/api/v1/api/v1/...` 404 twice now (once in
 * the client's own default, once from a wrong deployment instruction).
 * Stripping it defensively means either form works from now on.
 */
export function resolveBaseUrl(raw: string | undefined): string {
  if (!raw) {
    return '';
  }
  return raw.replace(/\/api\/v1\/?$/, '');
}
