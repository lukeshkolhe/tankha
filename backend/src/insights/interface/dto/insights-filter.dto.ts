import { EmployeeStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * The shared workforce filter set as query params. Whitelisted to exactly the
 * fields the employee list accepts, so the dashboard and the list always
 * describe the same population. No pagination — aggregates are small.
 */
export class InsightsFilterDto {
  @ApiPropertyOptional({ description: 'Case-insensitive match on name / employee code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Department id' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
