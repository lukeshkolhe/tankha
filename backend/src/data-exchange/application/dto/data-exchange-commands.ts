import { EmployeeListFilters } from 'src/workforce/domain/employee.repository';
import { SheetFormat } from '../../domain/sheet-parser';

/** The re-sent file plus the conflicts HR confirmed, as commit receives them. */
export interface CommitImportCommand {
  buffer: Buffer;
  format: SheetFormat;
  filename: string;
  applyEmployeeCodes: string[];
}

/** A filtered export request: the same filters as the list, plus sort + format. */
export interface ExportQuery {
  filters: EmployeeListFilters;
  sort?: string;
  format: SheetFormat;
}
