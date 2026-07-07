import { EmployeeRow } from '../../domain/employee-row';
import {
  rowFromRecord,
  SheetFormat,
  SheetParser,
  SheetTable,
  SheetWriter,
} from '../../domain/sheet-parser';

type SheetRecord = Record<string, string | number>;

/** Encodes rows into a buffer the {@link FakeSheetParser} reads back verbatim. */
export function encodeSheet(rows: ReadonlyArray<SheetRecord>): Buffer {
  return Buffer.from(JSON.stringify(rows));
}

/**
 * In-memory `SheetParser` for unit tests: decodes the JSON buffer produced by
 * `encodeSheet` / `FakeSheetWriter` into `EmployeeRow[]`, assigning 1-based
 * `rowNumber`s (header is row 1). Reads only known columns via `Object.hasOwn`,
 * so unexpected keys in an untrusted record are ignored.
 */
export class FakeSheetParser extends SheetParser {
  async parse(buffer: Buffer, _format: SheetFormat): Promise<EmployeeRow[]> {
    const records = JSON.parse(buffer.toString()) as SheetRecord[];
    return records.map((record, index) => rowFromRecord(record, index + 2));
  }
}

/** In-memory `SheetWriter` for unit tests: captures the last table + round-trips. */
export class FakeSheetWriter extends SheetWriter {
  lastTable?: SheetTable;

  async write(table: SheetTable, _format: SheetFormat): Promise<Buffer> {
    this.lastTable = table;
    return encodeSheet(table.rows);
  }
}
