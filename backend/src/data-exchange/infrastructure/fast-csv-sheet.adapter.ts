import { Injectable } from '@nestjs/common';
import { parseString, writeToBuffer } from 'fast-csv';
import { EmployeeRow } from '../domain/employee-row';
import { rowFromRecord, SheetRecord, SheetTable } from '../domain/sheet-parser';

/**
 * fast-csv adapter for `.csv`. Parses the buffered string with a header row into
 * the shared `rowFromRecord`, and writes a table with its columns as the header
 * (in order). Buffer in, buffer out — the upload never leaves memory.
 */
@Injectable()
export class FastCsvSheetAdapter {
  parse(buffer: Buffer): Promise<EmployeeRow[]> {
    return new Promise((resolve, reject) => {
      const rows: EmployeeRow[] = [];
      let dataIndex = 0;
      parseString(buffer.toString(), { headers: true, ignoreEmpty: true })
        .on('error', reject)
        .on('data', (record: SheetRecord) => rows.push(rowFromRecord(record, dataIndex++ + 2)))
        .on('end', () => resolve(rows));
    });
  }

  write(table: SheetTable): Promise<Buffer> {
    return writeToBuffer(table.rows as Record<string, string | number>[], {
      headers: [...table.columns],
    });
  }
}
