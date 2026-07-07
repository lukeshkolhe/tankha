import { EmployeeStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transport shape for `GET /employees`. Shape/type only — the domain whitelists
 * the sort field and coerces pagination. Filters map onto the composite indexes.
 */
export class ListEmployeesQueryDto {
  @ApiPropertyOptional({ description: '1-based page number', example: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: 'Rows per page (default 25, max 100)', example: 25 })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiPropertyOptional({ description: 'field:dir — lastName|joinDate|salaryTotal', example: 'lastName:asc' })
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
