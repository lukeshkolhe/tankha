/**
 * Both import endpoints take `multipart/form-data`. Building the `FormData`
 * here — instead of inline in the mutation — keeps the shape unit-testable
 * without mocking `fetch`/`api.POST` at all.
 */
export function buildPreviewForm(file: File): FormData {
  const form = new FormData();
  form.append('file', file, file.name);
  return form;
}

/**
 * Commit re-sends the same file plus the `employeeCode`s HR ticked to
 * override. A repeated form field is how an array crosses multipart, so one
 * `append` per selected code (never a single joined string).
 */
export function buildCommitForm(file: File, applyEmployeeCodes: string[]): FormData {
  const form = new FormData();
  form.append('file', file, file.name);
  for (const code of applyEmployeeCodes) {
    form.append('applyEmployeeCodes', code);
  }
  return form;
}
