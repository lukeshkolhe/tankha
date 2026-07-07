import { ApiProperty } from '@nestjs/swagger';

/** A department/designation as it appears embedded in an employee view. */
export class NamedReferenceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}
