import { TenantContext, UnitOfWork } from 'src/platform';
import { InMemoryUserRepository } from './testing/in-memory-user.repository';
import { InMemoryOrganisationRepository } from './testing/in-memory-organisation.repository';
import { FakePasswordHasher } from './testing/fake-password-hasher';
import { FakeTokenSigner } from './testing/fake-token-signer';
import { RecordingReferenceSeeder } from './testing/recording-reference-seeder';
import { SignUpUseCase } from './sign-up.usecase';
import { LogInUseCase } from './log-in.usecase';
import { GetSessionUseCase } from './get-session.usecase';
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from '../domain/access.errors';
import { AuthResult } from './dto/access-commands';

/** A UnitOfWork that runs its work immediately — no real transaction in unit tests. */
class ImmediateUnitOfWork extends UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

function tenant(userId: string, organisationId: string): TenantContext {
  return {
    get userId() {
      return userId;
    },
    get organisationId() {
      return organisationId;
    },
  } as TenantContext;
}

interface Fixture {
  users: InMemoryUserRepository;
  organisations: InMemoryOrganisationRepository;
  hasher: FakePasswordHasher;
  seeder: RecordingReferenceSeeder;
  signUp: SignUpUseCase;
  logIn: LogInUseCase;
}

function fixture(): Fixture {
  const users = new InMemoryUserRepository();
  const organisations = new InMemoryOrganisationRepository();
  const hasher = new FakePasswordHasher();
  const seeder = new RecordingReferenceSeeder();
  const tokens = new FakeTokenSigner();
  const signUp = new SignUpUseCase(organisations, users, hasher, seeder, tokens, new ImmediateUnitOfWork());
  const logIn = new LogInUseCase(users, organisations, hasher, tokens);
  return { users, organisations, hasher, seeder, signUp, logIn };
}

function signUpPriya(signUp: SignUpUseCase): Promise<AuthResult> {
  return signUp.execute({
    name: 'Priya Rao',
    email: 'priya@acme.com',
    password: 's3cret-pass',
    organisationName: 'ACME',
  });
}

describe('SignUpUseCase', () => {
  it('creates the organisation and owner user and returns a token for them', async () => {
    const { signUp } = fixture();

    const result = await signUpPriya(signUp);

    expect(result.user).toEqual({ id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' });
    expect(result.organisation).toEqual({ id: 'org_1', name: 'ACME' });
    expect(result.accessToken).toBe('token(usr_1:org_1:priya@acme.com)');
  });

  it('stores an argon2-style hash of the password, never the plaintext', async () => {
    const { signUp, users, hasher } = fixture();

    await signUpPriya(signUp);

    const stored = await users.findById('usr_1');
    expect(stored?.passwordHash).toBe(await hasher.hash('s3cret-pass'));
    expect(stored?.passwordHash).not.toBe('s3cret-pass');
  });

  it('seeds the default reference lists for the new organisation', async () => {
    const { signUp, seeder } = fixture();

    await signUpPriya(signUp);

    expect(seeder.seededOrganisationIds).toEqual(['org_1']);
  });

  it('rejects a signup whose email is already registered', async () => {
    const { signUp } = fixture();
    await signUpPriya(signUp);

    await expect(signUpPriya(signUp)).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });

  it('matches a duplicate email case-insensitively', async () => {
    const { signUp } = fixture();
    await signUpPriya(signUp);

    await expect(
      signUp.execute({
        name: 'Other',
        email: 'PRIYA@acme.com',
        password: 'another-pass',
        organisationName: 'Beta',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});

describe('LogInUseCase', () => {
  it('issues a token when the email and password match', async () => {
    const { signUp, logIn } = fixture();
    await signUpPriya(signUp);

    const result = await logIn.execute({ email: 'priya@acme.com', password: 's3cret-pass' });

    expect(result.user).toEqual({ id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' });
    expect(result.organisation).toEqual({ id: 'org_1', name: 'ACME' });
    expect(result.accessToken).toBe('token(usr_1:org_1:priya@acme.com)');
  });

  it('rejects an unknown email with the generic InvalidCredentialsError', async () => {
    const { logIn } = fixture();

    await expect(
      logIn.execute({ email: 'nobody@acme.com', password: 's3cret-pass' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects a wrong password with the same generic error and message as an unknown email', async () => {
    const { signUp, logIn } = fixture();
    await signUpPriya(signUp);

    const wrongPassword = await logIn
      .execute({ email: 'priya@acme.com', password: 'not-the-pass' })
      .catch((error: Error) => error);
    const unknownEmail = await logIn
      .execute({ email: 'nobody@acme.com', password: 's3cret-pass' })
      .catch((error: Error) => error);

    expect(wrongPassword).toBeInstanceOf(InvalidCredentialsError);
    expect((wrongPassword as Error).message).toBe('Email or password is incorrect.');
    expect((wrongPassword as Error).message).toBe((unknownEmail as Error).message);
  });
});

describe('GetSessionUseCase', () => {
  it('returns the authenticated user and their organisation', async () => {
    const { signUp, users, organisations } = fixture();
    await signUpPriya(signUp);

    const session = await new GetSessionUseCase(users, organisations, tenant('usr_1', 'org_1')).execute();

    expect(session.user).toEqual({ id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' });
    expect(session.organisation).toEqual({ id: 'org_1', name: 'ACME' });
  });
});
