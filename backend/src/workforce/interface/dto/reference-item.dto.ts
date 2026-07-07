import { ApiProperty } from '@nestjs/swagger';

/** A tenant-scoped reference row (department or designation). */
export class ReferenceItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

/** A global ISO country. */
export class CountryItemDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

/** A global ISO currency, with the digits needed to render its minor units. */
export class CurrencyItemDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  minorUnitDigits!: number;
}
