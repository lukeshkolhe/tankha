import { Injectable } from '@nestjs/common';
import { ImportPreview } from '../domain/import-preview';
import { ConflictRow } from '../domain/conflict-row';
import { FailedRow } from '../domain/failed-row';
import { SheetFormat, SheetParser } from '../domain/sheet-parser';
import { ClassifiedRow, ImportClassifier } from './import-classifier';

/**
 * Phase 1 of import: parse the upload, classify every row with the shared rules,
 * and report the three buckets. Persists nothing — HR reviews what a commit would
 * do (create N, override these conflicts, reject those rows) before anything is
 * written.
 */
@Injectable()
export class PreviewImportUseCase {
  constructor(
    private readonly parser: SheetParser,
    private readonly classifier: ImportClassifier,
  ) {}

  async execute(buffer: Buffer, format: SheetFormat): Promise<ImportPreview> {
    const rows = await this.parser.parse(buffer, format);
    const classified = await this.classifier.classify(rows);
    return {
      toInsert: classified.filter((row) => row.kind === 'new').length,
      conflicts: classified.filter(isConflict).map(toConflictRow),
      invalid: classified.filter(isInvalid).map(toFailedRow),
    };
  }
}

type Conflict = Extract<ClassifiedRow, { kind: 'conflict' }>;
type Invalid = Extract<ClassifiedRow, { kind: 'invalid' }>;

function isConflict(row: ClassifiedRow): row is Conflict {
  return row.kind === 'conflict';
}

function isInvalid(row: ClassifiedRow): row is Invalid {
  return row.kind === 'invalid';
}

function toConflictRow(row: Conflict): ConflictRow {
  return { rowNumber: row.row.rowNumber, employeeCode: row.row.employeeCode, changes: row.changes };
}

function toFailedRow(row: Invalid): FailedRow {
  return { rowNumber: row.row.rowNumber, employeeCode: row.row.employeeCode || undefined, reasons: row.reasons };
}
