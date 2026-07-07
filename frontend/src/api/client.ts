import createClient from 'openapi-fetch';
import type { paths } from './schema';
import { tokenStore } from '../auth/token-store';

/**
 * The one typed HTTP client the whole app calls through — generated types from
 * the backend's OpenAPI spec (`npm run generate:api`), zero hand-written
 * request/response shapes. `baseUrl` defaults to the Vite dev-server proxy
 * (`/api/v1` -> http://localhost:3000) so the same relative path works in dev
 * and in a same-origin production deployment.
 */
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
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
