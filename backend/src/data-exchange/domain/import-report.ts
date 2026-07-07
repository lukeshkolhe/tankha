import { FailedRow } from './failed-row';

/**
 * The outcome of `CommitImportUseCase`. `inserted` new employees created,
 * `updated` conflicts HR confirmed, `skippedConflicts` existing codes left
 * untouched, and `failed` the rows rejected on re-validation. Partial success is
 * expected: valid rows commit even when others fail.
 */
export interface ImportReport {
  inserted: number;
  updated: number;
  skippedConflicts: number;
  failed: FailedRow[];
}
