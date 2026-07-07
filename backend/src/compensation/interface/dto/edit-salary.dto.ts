import { SalaryComponentType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
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

export class EditSalaryDto {
  @ApiProperty({ type: [SalaryComponentDto] })
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => SalaryComponentDto)
  components!: SalaryComponentDto[];

  @ApiProperty({ description: 'Reason for the change — required (FR-3.3)' })
  @IsString()
  @IsNotEmpty()
  remark!: string;
}
