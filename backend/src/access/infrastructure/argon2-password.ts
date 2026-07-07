import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasher } from '../domain/password';

/**
 * argon2 adapter for the PasswordHasher port. argon2id is the current OWASP
 * recommendation; `verify` returns false (never throws) on a malformed or
 * non-matching hash so the login use case can map any mismatch to one generic
 * InvalidCredentialsError.
 */
@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
