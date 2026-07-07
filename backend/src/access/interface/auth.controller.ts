import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/platform';
import { SignUpUseCase } from '../application/sign-up.usecase';
import { LogInUseCase } from '../application/log-in.usecase';
import { GetSessionUseCase } from '../application/get-session.usecase';
import { AuthResult, SessionView } from '../application/dto/access-commands';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/log-in.dto';
import { AuthResponseDto, SessionResponseDto } from './dto/auth-response.dto';

/**
 * Authentication endpoints. Signup and login are @Public() (no token yet); /me is
 * bearer-protected and reads its principal from the tenant context.
 */
@ApiTags('access')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUp: SignUpUseCase,
    private readonly logIn: LogInUseCase,
    private readonly getSession: GetSessionUseCase,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register an organisation and its owner user (FR-1.1, FR-1.2)' })
  @ApiOkResponse({ type: AuthResponseDto })
  signup(@Body() body: SignUpDto): Promise<AuthResult> {
    return this.signUp.execute(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive an access token (FR-1.1)' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() body: LogInDto): Promise<AuthResult> {
    return this.logIn.execute(body);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'The current session — user + organisation' })
  @ApiOkResponse({ type: SessionResponseDto })
  me(): Promise<SessionView> {
    return this.getSession.execute();
  }
}
