import { ApiProperty } from '@nestjs/swagger';
import { FailedRowDto } from './import-preview-response.dto';

/**
 * `POST /employees/import/commit` response. Partial success is expected: valid
 * rows commit even when others fail.
 */
export class ImportReportResponseDto {
  @ApiProperty()
  inserted!: number;

  @ApiProperty()
  updated!: number;

  @ApiProperty()
  skippedConflicts!: number;

  @ApiProperty({ type: [FailedRowDto] })
  failed!: FailedRowDto[];
}
