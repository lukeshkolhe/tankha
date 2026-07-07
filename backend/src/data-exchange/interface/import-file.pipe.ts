import { Injectable, PipeTransform } from '@nestjs/common';
import { ValidationError } from 'src/platform';
import { SheetFormat } from '../domain/sheet-parser';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** The buffered upload as Multer memoryStorage delivers it (no disk path). */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/** The validated import file the use cases consume. */
export interface UploadedSheet {
  buffer: Buffer;
  format: SheetFormat;
  filename: string;
}

/**
 * Validates the multipart upload and resolves its format from the extension /
 * MIME type. Rejects a missing or non-`.xlsx`/`.csv` file with a 400. The buffer
 * comes straight from Multer memoryStorage — it is never written to disk.
 */
@Injectable()
export class ImportFilePipe implements PipeTransform<UploadedFile | undefined, UploadedSheet> {
  transform(file: UploadedFile | undefined): UploadedSheet {
    if (!file) {
      throw new ValidationError('A file upload is required.', [{ field: 'file', reason: 'required' }]);
    }
    const format = formatOf(file);
    if (!format) {
      throw new ValidationError('Only .xlsx and .csv files can be imported.', [
        { field: 'file', reason: 'invalid' },
      ]);
    }
    return { buffer: file.buffer, format, filename: file.originalname };
  }
}

function formatOf(file: UploadedFile): SheetFormat | null {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.csv') || file.mimetype === 'text/csv') {
    return 'csv';
  }
  if (name.endsWith('.xlsx') || file.mimetype === XLSX_MIME) {
    return 'xlsx';
  }
  return null;
}
