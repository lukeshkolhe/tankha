import { EmployeeStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { SalaryComponentDto } from 'src/compensation/interface/dto/edit-salary.dto';
import { NamedReferenceDto } from './named-reference.dto';

/** The current-pay summary embedded in the employee detail view. */
export class SalarySummaryViewDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: [SalaryComponentDto] })
  components!: SalaryComponentDto[];

  @ApiProperty()
  totalMinor!: number;
}

/** Full employee detail: attributes + current salary structure summary. */
export class EmployeeViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeCode!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ type: NamedReferenceDto })
  department!: NamedReferenceDto;

  @ApiProperty({ type: NamedReferenceDto })
  designation!: NamedReferenceDto;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty()
  currencyCode!: string;

  @ApiProperty({ enum: EmployeeStatus })
  status!: EmployeeStatus;

  @ApiProperty()
  joinDate!: string;

  @ApiProperty({ type: SalarySummaryViewDto, nullable: true })
  salary!: SalarySummaryViewDto | null;
}
