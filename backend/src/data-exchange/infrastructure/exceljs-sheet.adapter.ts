import { Injectable } from '@nestjs/common';
import { Row, Workbook, Worksheet } from 'exceljs';
import { EmployeeRow } from '../domain/employee-row';
import { rowFromRecord, SheetRecord, SheetTable } from '../domain/sheet-parser';

/**
 * exceljs adapter for `.xlsx`. Reads the first worksheet, treating row 1 as the
 * header and mapping every subsequent row through the shared `rowFromRecord`;
 * writes a table with its columns as the header row. Streams in/out of buffers —
 * nothing touches disk.
 */
@Injectable()
export class ExcelJsSheetAdapter {
  async parse(buffer: Buffer): Promise<EmployeeRow[]> {
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return [];
    }
    return this.readRows(sheet);
  }

  async write(table: SheetTable): Promise<Buffer> {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Employees');
    sheet.columns = table.columns.map((column) => ({ header: column, key: column }));
    table.rows.forEach((row) => sheet.addRow(row));
    return Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
  }

  private readRows(sheet: Worksheet): EmployeeRow[] {
    const headers = headerColumns(sheet);
    const rows: EmployeeRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        rows.push(rowFromRecord(recordOf(row, headers), rowNumber));
      }
    });
    return rows;
  }
}

function headerColumns(sheet: Worksheet): Map<string, number> {
  const columns = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    columns.set(String(cell.text).trim(), columnNumber);
  });
  return columns;
}

function recordOf(row: Row, headers: Map<string, number>): SheetRecord {
  const record: SheetRecord = {};
  headers.forEach((columnNumber, name) => {
    record[name] = row.getCell(columnNumber).text;
  });
  return record;
}
