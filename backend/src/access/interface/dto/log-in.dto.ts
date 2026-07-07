import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Request body for POST /auth/login. */
export class LogInDto {
  @ApiProperty({ example: 'priya@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 's3cret-pass' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
