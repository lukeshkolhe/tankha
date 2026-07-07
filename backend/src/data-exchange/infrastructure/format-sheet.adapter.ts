import { Injectable } from '@nestjs/common';
import { EmployeeRow } from '../domain/employee-row';
import { SheetFormat, SheetParser, SheetTable, SheetWriter } from '../domain/sheet-parser';
import { ExcelJsSheetAdapter } from './exceljs-sheet.adapter';
import { FastCsvSheetAdapter } from './fast-csv-sheet.adapter';

/** The read/write pair for one format. */
interface FormatCodec {
  parse(buffer: Buffer): Promise<EmployeeRow[]>;
  write(table: SheetTable): Promise<Buffer>;
}

/** `SheetParser` that dispatches to the exceljs or fast-csv adapter by format. */
@Injectable()
export class FormatSheetParser extends SheetParser {
  constructor(
    private readonly excel: ExcelJsSheetAdapter,
    private readonly csv: FastCsvSheetAdapter,
  ) {
    super();
  }

  parse(buffer: Buffer, format: SheetFormat): Promise<EmployeeRow[]> {
    return codecFor(format, this.excel, this.csv).parse(buffer);
  }
}

/** `SheetWriter` that dispatches to the exceljs or fast-csv adapter by format. */
@Injectable()
export class FormatSheetWriter extends SheetWriter {
  constructor(
    private readonly excel: ExcelJsSheetAdapter,
    private readonly csv: FastCsvSheetAdapter,
  ) {
    super();
  }

  write(table: SheetTable, format: SheetFormat): Promise<Buffer> {
    return codecFor(format, this.excel, this.csv).write(table);
  }
}

function codecFor(
  format: SheetFormat,
  excel: FormatCodec,
  csv: FormatCodec,
): FormatCodec {
  return format === 'csv' ? csv : excel;
}
