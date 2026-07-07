import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { tokenStore } from '../auth/token-store';
import { resolveBaseUrl } from './resolve-base-url';

/**
 * The one typed HTTP client the whole app calls through — generated types from
 * the backend's OpenAPI spec (`npm run generate:api`), zero hand-written
 * request/response shapes. An empty baseUrl resolves relative to the current
 * origin, which the Vite dev-server proxy (`/api/v1` -> http://localhost:3000)
 * intercepts in dev; in production, `VITE_API_BASE_URL` should be the
 * backend's origin (`resolveBaseUrl` strips a trailing /api/v1 defensively,
 * since every generated path key already carries that prefix).
 */
export const api = createClient<paths>({
  baseUrl: resolveBaseUrl(import.meta.env.VITE_API_BASE_URL),
});

api.use({
  onRequest({ request }) {
    const token = tokenStore.get();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
});
