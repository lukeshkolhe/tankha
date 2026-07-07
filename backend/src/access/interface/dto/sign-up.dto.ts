import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/** Request body for POST /auth/signup. */
export class SignUpDto {
  @ApiProperty({ example: 'Priya Rao' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'priya@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 's3cret-pass', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'ACME' })
  @IsString()
  @IsNotEmpty()
  organisationName!: string;
}
