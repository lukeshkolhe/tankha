import { ApiProperty } from '@nestjs/swagger';
import { SalaryComponentDto } from './edit-salary.dto';

/** Current pay — components + computed total, in the employee's own currency. */
export class SalaryViewDto {
  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: [SalaryComponentDto] })
  components!: SalaryComponentDto[];

  @ApiProperty()
  totalMinor!: number;
}
