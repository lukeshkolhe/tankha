import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { tokenStore } from '../auth/token-store';

/**
 * The one typed HTTP client the whole app calls through — generated types from
 * the backend's OpenAPI spec (`npm run generate:api`), zero hand-written
 * request/response shapes. Every generated path key already carries the
 * backend's `/api/v1` global prefix (baked in from the running Nest app), so
 * `baseUrl` must NOT repeat it — otherwise every request doubles up as
 * `/api/v1/api/v1/...`. An empty baseUrl resolves relative to the current
 * origin, which the Vite dev-server proxy (`/api/v1` -> http://localhost:3000)
 * intercepts in dev, and which is correct as-is behind a same-origin reverse
 * proxy in production.
 */
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
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
