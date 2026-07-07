/** A single field-level validation/conflict detail, e.g. `{ field: 'email', reason: 'duplicate' }`. */
export interface ApiErrorDetail {
  field: string;
  reason: string;
}

/**
 * The JSON error body every domain error maps to (see the backend's
 * `platform/http/domain-exception.filter.ts`). The generated OpenAPI schema
 * only documents the 2xx response for `/auth/signup` and `/auth/login`, so
 * `api.POST(...)`'s `error` comes back typed as `never` — this hand-written
 * shape mirrors the filter's actual `toBody()` output and is what forms cast
 * the thrown error to.
 */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: ApiErrorDetail[];
}
