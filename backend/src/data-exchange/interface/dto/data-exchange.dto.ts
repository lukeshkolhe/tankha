import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';
import { SheetFormat } from '../../domain/sheet-parser';

/** The two sheet formats offered on every stream route. */
export enum SheetFormatDto {
  xlsx = 'xlsx',
  csv = 'csv',
}

/** `?format=` for the sample-sheet and export streams. */
export class SheetFormatQueryDto {
  @ApiPropertyOptional({ enum: SheetFormatDto, default: SheetFormatDto.xlsx })
  @IsOptional()
  @IsEnum(SheetFormatDto)
  format?: SheetFormat;
}

/** Multipart fields on commit: the confirmed conflicts (the file is separate). */
export class CommitImportDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'employeeCodes of the conflicts HR confirmed; omit/[] to insert new only',
  })
  @IsOptional()
  applyEmployeeCodes?: string | string[];
}

/** `GET /employees/export` — the same filters as the list plus a format. */
export class ExportQueryDto {
  @ApiPropertyOptional({ enum: SheetFormatDto, default: SheetFormatDto.xlsx })
  @IsOptional()
  @IsEnum(SheetFormatDto)
  format?: SheetFormat;

  @ApiPropertyOptional({ description: 'field:dir — lastName|joinDate|salaryTotal' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive match on name + employeeCode' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by departmentId' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Filter by designationId' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ description: 'Filter by ISO country code' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}

/** Multipart file field (Swagger only — the pipe validates the real upload). */
export class ImportFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: unknown;
}
