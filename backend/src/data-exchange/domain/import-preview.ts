import { ConflictRow } from './conflict-row';
import { FailedRow } from './failed-row';

/**
 * The dry-run result of `PreviewImportUseCase`: nothing is written. `toInsert`
 * counts the new rows a commit would create; `conflicts` are existing codes HR
 * decides on per row; `invalid` are rows that will never be applied.
 */
export interface ImportPreview {
  toInsert: number;
  conflicts: ConflictRow[];
  invalid: FailedRow[];
}
