import { ApiProperty } from '@nestjs/swagger';

/**
 * One field of a conflicting row that an override would change. `current`/
 * `incoming` are a string or a number depending on the field (money fields are
 * integer minor units); `currency` is present only for money fields.
 */
export class FieldChangeDto {
  @ApiProperty()
  field!: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }], nullable: true })
  current!: string | number | null;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  incoming!: string | number;

  @ApiProperty({ required: false })
  currency?: string;
}

/** A valid sheet row whose employeeCode already exists — HR decides per row. */
export class ConflictRowDto {
  @ApiProperty()
  rowNumber!: number;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty({ type: [FieldChangeDto] })
  changes!: FieldChangeDto[];
}

/** A sheet row rejected regardless of HR's choice, with plain-language reasons. */
export class FailedRowDto {
  @ApiProperty()
  rowNumber!: number;

  @ApiProperty({ required: false })
  employeeCode?: string;

  @ApiProperty({ type: [String] })
  reasons!: string[];
}

/** `POST /employees/import/preview` response — nothing written yet. */
export class ImportPreviewResponseDto {
  @ApiProperty()
  toInsert!: number;

  @ApiProperty({ type: [ConflictRowDto] })
  conflicts!: ConflictRowDto[];

  @ApiProperty({ type: [FailedRowDto] })
  invalid!: FailedRowDto[];
}
