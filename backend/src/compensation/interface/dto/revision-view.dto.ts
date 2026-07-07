import { ApiProperty } from '@nestjs/swagger';
import { SalaryComponentDto } from './edit-salary.dto';

/** The user attributed to a revision. */
export class ChangedByDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

/** One entry in the salary-change timeline, newest-first. */
export class RevisionViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  oldTotalMinor!: number | null;

  @ApiProperty()
  newTotalMinor!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  remark!: string;

  @ApiProperty({ type: ChangedByDto })
  changedBy!: ChangedByDto;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: [SalaryComponentDto] })
  componentsSnapshot!: SalaryComponentDto[];
}

/** The standard paginated list envelope: `{ data, total, page, pageSize }`. */
export class RevisionPageDto {
  @ApiProperty({ type: [RevisionViewDto] })
  data!: RevisionViewDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
