import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { EmployeeListFilters } from 'src/workforce/domain/employee.repository';
import { PreviewImportUseCase } from '../application/preview-import.usecase';
import { CommitImportUseCase } from '../application/commit-import.usecase';
import { ExportEmployeesUseCase } from '../application/export-employees.usecase';
import { BuildSampleSheetUseCase } from '../application/build-sample-sheet.usecase';
import { SheetFormat } from '../domain/sheet-parser';
import { ImportPreview } from '../domain/import-preview';
import { ImportReport } from '../domain/import-report';
import { ImportFilePipe, UploadedSheet } from './import-file.pipe';
import { CommitImportDto, ExportQueryDto, SheetFormatQueryDto } from './dto/data-exchange.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CONTENT_TYPE: Record<SheetFormat, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

/**
 * Import (preview → commit) and export surfaces, tenant-scoped. Uploads use
 * Multer memoryStorage, so the file arrives as an in-memory `Buffer` and is
 * discarded when the request ends — nothing is written to disk. Downloads stream
 * a generated buffer as an attachment.
 */
@ApiTags('data-exchange')
@ApiBearerAuth()
@Controller('employees')
export class DataExchangeController {
  constructor(
    private readonly previewImport: PreviewImportUseCase,
    private readonly commitImport: CommitImportUseCase,
    private readonly exportEmployees: ExportEmployeesUseCase,
    private readonly buildSampleSheet: BuildSampleSheetUseCase,
  ) {}

  @Get('sample-sheet')
  @ApiOperation({ summary: 'Download the pre-filled, importable template (FR-4.1)' })
  async sampleSheet(@Query() query: SheetFormatQueryDto, @Res() res: Response): Promise<void> {
    const format = query.format ?? 'xlsx';
    const buffer = await this.buildSampleSheet.execute(format);
    stream(res, buffer, format, 'tankha-sample');
  }

  @Post('import/preview')
  @ApiOperation({ summary: 'Dry-run import — buckets, nothing written (FR-4.1, FR-4.2)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  preview(@UploadedFile(ImportFilePipe) file: UploadedSheet): Promise<ImportPreview> {
    return this.previewImport.execute(file.buffer, file.format);
  }

  @Post('import/commit')
  @ApiOperation({ summary: 'Apply import — insert new + confirmed overrides (FR-4.2)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  commit(
    @UploadedFile(ImportFilePipe) file: UploadedSheet,
    @Body() body: CommitImportDto,
  ): Promise<ImportReport> {
    return this.commitImport.execute({
      buffer: file.buffer,
      format: file.format,
      filename: file.filename,
      applyEmployeeCodes: toArray(body.applyEmployeeCodes),
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Stream the current filtered dataset, re-importable (FR-4.3)' })
  async export(@Query() query: ExportQueryDto, @Res() res: Response): Promise<void> {
    const format = query.format ?? 'xlsx';
    const buffer = await this.exportEmployees.execute({
      filters: toFilters(query),
      sort: query.sort,
      format,
    });
    stream(res, buffer, format, 'tankha-employees');
  }
}

function stream(res: Response, buffer: Buffer, format: SheetFormat, baseName: string): void {
  res.set({
    'Content-Type': CONTENT_TYPE[format],
    'Content-Disposition': `attachment; filename="${baseName}.${format}"`,
  });
  res.send(buffer);
}

function toFilters(query: ExportQueryDto): EmployeeListFilters {
  return {
    search: query.search,
    departmentId: query.department,
    designationId: query.designation,
    countryCode: query.country,
    status: query.status,
  };
}

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
