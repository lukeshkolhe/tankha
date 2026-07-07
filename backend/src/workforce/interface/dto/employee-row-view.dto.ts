import { EmployeeStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/**
 * One row of the employee list — includes the current salary total + currency
 * read from the SalaryStructure projection, so the list shows pay at a glance.
 */
export class EmployeeRowViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  department!: string;

  @ApiProperty()
  designation!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: EmployeeStatus })
  status!: EmployeeStatus;

  @ApiProperty()
  joinDate!: string;

  @ApiProperty({ type: Number, nullable: true })
  salaryTotalMinor!: number | null;
}

/** The standard paginated list envelope: `{ data, total, page, pageSize }`. */
export class EmployeePageDto {
  @ApiProperty({ type: [EmployeeRowViewDto] })
  data!: EmployeeRowViewDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
