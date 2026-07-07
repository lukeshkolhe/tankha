/**
 * Port for one-way password hashing. Implemented by an argon2 adapter in
 * infrastructure; the application layer depends only on this abstraction, so use
 * cases stay free of any crypto library and unit tests use a trivial fake.
 */
export abstract class PasswordHasher {
  /** Derive a storable hash from a plaintext password. */
  abstract hash(plain: string): Promise<string>;

  /** True when the plaintext matches the stored hash. */
  abstract verify(hash: string, plain: string): Promise<boolean>;
}
