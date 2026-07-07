import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'src/platform';
import { Email } from '../domain/email.vo';
import { InvalidCredentialsError } from '../domain/access.errors';
import { Organisation } from '../domain/organisation.entity';
import { User } from '../domain/user.entity';
import { OrganisationRepository } from '../domain/organisation.repository';
import { UserRepository } from '../domain/user.repository';
import { PasswordHasher } from '../domain/password';
import { TokenSigner } from '../domain/token-signer';
import { organisationView, userView } from './auth-view';
import { AuthResult, LogInQuery } from './dto/access-commands';

/**
 * Authenticates a user and issues an access token. Any mismatch — unknown email
 * or wrong password — raises the same generic InvalidCredentialsError, so the
 * response never reveals whether an account exists (no account probing).
 */
@Injectable()
export class LogInUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly organisations: OrganisationRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenSigner,
  ) {}

  async execute(query: LogInQuery): Promise<AuthResult> {
    const user = await this.authenticate(query);
    const organisation = await this.loadOrganisation(user);
    return this.authResult(user, organisation);
  }

  private async authenticate(query: LogInQuery): Promise<User> {
    const user = await this.users.findByEmail(Email.of(query.email));
    if (!user) {
      throw new InvalidCredentialsError();
    }
    const matches = await this.hasher.verify(user.passwordHash, query.password);
    if (!matches) {
      throw new InvalidCredentialsError();
    }
    return user;
  }

  private async loadOrganisation(user: User): Promise<Organisation> {
    const organisation = await this.organisations.findById(user.organisationId);
    if (!organisation) {
      throw new NotFoundError(`Organisation ${user.organisationId} not found.`);
    }
    return organisation;
  }

  private authResult(user: User, organisation: Organisation): AuthResult {
    const accessToken = this.tokens.sign({
      sub: user.id,
      organisationId: organisation.id,
      email: user.email.value,
    });
    return { accessToken, user: userView(user), organisation: organisationView(organisation) };
  }
}
