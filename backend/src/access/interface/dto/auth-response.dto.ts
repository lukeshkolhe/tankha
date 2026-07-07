import { ApiProperty } from '@nestjs/swagger';

/** The user shape returned by the auth endpoints (Swagger documentation). */
export class UserDto {
  @ApiProperty({ example: 'usr_abc123' })
  id!: string;

  @ApiProperty({ example: 'Priya Rao' })
  name!: string;

  @ApiProperty({ example: 'priya@acme.com' })
  email!: string;
}

/** The organisation shape returned by the auth endpoints. */
export class OrganisationDto {
  @ApiProperty({ example: 'org_abc123' })
  id!: string;

  @ApiProperty({ example: 'ACME' })
  name!: string;
}

/** Response body for signup and login. */
export class AuthResponseDto {
  @ApiProperty({ description: 'Signed JWT bearer token', example: 'eyJhbGciOi…' })
  accessToken!: string;

  @ApiProperty({ type: UserDto })
  user!: UserDto;

  @ApiProperty({ type: OrganisationDto })
  organisation!: OrganisationDto;
}

/** Response body for GET /auth/me. */
export class SessionResponseDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;

  @ApiProperty({ type: OrganisationDto })
  organisation!: OrganisationDto;
}
