import { SalaryComponentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SalaryComponentDto {
  @ApiProperty({ enum: SalaryComponentType })
  @IsEnum(SalaryComponentType)
  type!: SalaryComponentType;

  @ApiProperty({ description: 'Annual amount in integer minor units (>= 0)' })
  @IsInt()
  @Min(0)
  amountMinor!: number;
}

export class SalaryInputDto {
  @ApiProperty({ type: [SalaryComponentDto] })
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => SalaryComponentDto)
  components!: SalaryComponentDto[];
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-1001' })
  @IsString()
  @IsNotEmpty()
  employeeCode!: string;

  @ApiProperty({ example: 'Ravi' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Kumar' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  designationId!: string;

  @ApiProperty({ example: 'IN', description: 'ISO 3166-1 alpha-2' })
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @ApiProperty({ example: 'INR', description: 'ISO 4217' })
  @IsString()
  @IsNotEmpty()
  currencyCode!: string;

  @ApiProperty({ example: '2021-04-01', description: 'ISO date' })
  @IsDateString()
  joinDate!: string;

  @ApiProperty({ type: SalaryInputDto })
  @ValidateNested()
  @Type(() => SalaryInputDto)
  salary!: SalaryInputDto;
}
