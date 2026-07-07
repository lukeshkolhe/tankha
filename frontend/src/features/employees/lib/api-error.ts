/**
 * The backend's `400 VALIDATION_ERROR` / `409 CONFLICT` bodies carry an
 * optional `details` array of field-level reasons (schema.d.ts doesn't type
 * error responses, so this shape is asserted from the API contract in
 * `02-workforce.md` §2, not generated).
 */
export interface ApiErrorDetail {
  field: string;
  reason: string;
}

export interface ApiErrorBody {
  message?: string;
  details?: ApiErrorDetail[];
}

const REASON_MESSAGES: Record<string, string> = {
  duplicate: 'This employee code is already in use.',
};

/** Turns a raw API error body into a `{ field: message }` map a form can apply via `setError`. */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (typeof error !== 'object' || error === null) {
    return {};
  }

  const details = (error as ApiErrorBody).details;
  if (!Array.isArray(details)) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};
  for (const detail of details) {
    fieldErrors[detail.field] = REASON_MESSAGES[detail.reason] ?? detail.reason;
  }
  return fieldErrors;
}
