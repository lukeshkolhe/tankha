import { PasswordHasher } from '../../domain/password';

/**
 * Deterministic PasswordHasher for unit tests: a plaintext hashes to a stable
 * marked string and verify re-derives it, so tests can assert the stored value
 * is a hash (not the plaintext) without invoking real argon2.
 */
export class FakePasswordHasher extends PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed(${plain})`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed(${plain})`;
  }
}
