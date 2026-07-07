import { ApiProperty } from '@nestjs/swagger';

/** A per-currency compensation group. Never summed across currencies (NFR-3). */
export class CurrencyGroupDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty()
  headcount!: number;

  @ApiProperty()
  totalMinor!: number;

  @ApiProperty()
  averageMinor!: number;
}

/** `GET /insights/overview` response. */
export class OverviewResponseDto {
  @ApiProperty()
  headcount!: number;

  @ApiProperty({ type: [CurrencyGroupDto] })
  byCurrency!: CurrencyGroupDto[];
}

/** One breakdown line: a dimension (department or country) with its per-currency groups. */
export class BreakdownRowDto {
  @ApiProperty()
  dimension!: string;

  @ApiProperty({ type: [CurrencyGroupDto] })
  currencyGroups!: CurrencyGroupDto[];
}

/** `GET /insights/by-department | by-country` response. */
export class BreakdownResponseDto {
  @ApiProperty({ type: [BreakdownRowDto] })
  breakdown!: BreakdownRowDto[];
}
