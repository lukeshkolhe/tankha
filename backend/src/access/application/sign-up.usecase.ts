import { Injectable } from '@nestjs/common';
import { UnitOfWork } from 'src/platform';
import { Email } from '../domain/email.vo';
import { EmailAlreadyRegisteredError } from '../domain/access.errors';
import { Organisation } from '../domain/organisation.entity';
import { User } from '../domain/user.entity';
import { OrganisationRepository } from '../domain/organisation.repository';
import { UserRepository } from '../domain/user.repository';
import { PasswordHasher } from '../domain/password';
import { TokenSigner } from '../domain/token-signer';
import { ReferenceSeeder } from '../domain/reference-seeder';
import { organisationView, userView } from './auth-view';
import { AuthResult, SignUpCommand } from './dto/access-commands';

/**
 * Registers a new organisation and its owner user in one transaction: create the
 * organisation, hash the password, create the user, seed default reference lists,
 * then mint the access token. All writes run inside `unitOfWork.run` so a failure
 * anywhere rolls the whole signup back (NFR-4).
 */
@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly organisations: OrganisationRepository,
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly seeder: ReferenceSeeder,
    private readonly tokens: TokenSigner,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute(command: SignUpCommand): Promise<AuthResult> {
    const email = Email.of(command.email);
    return this.unitOfWork.run(() => this.register(command, email));
  }

  private async register(command: SignUpCommand, email: Email): Promise<AuthResult> {
    await this.assertEmailAvailable(email);
    const organisation = await this.organisations.create(command.organisationName);
    const user = await this.createOwner(command, email, organisation);
    await this.seeder.seedDefaults(organisation.id);
    return this.authResult(user, organisation);
  }

  private async assertEmailAvailable(email: Email): Promise<void> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredError(email.value);
    }
  }

  private async createOwner(
    command: SignUpCommand,
    email: Email,
    organisation: Organisation,
  ): Promise<User> {
    const passwordHash = await this.hasher.hash(command.password);
    return this.users.create({ organisationId: organisation.id, email, name: command.name, passwordHash });
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
