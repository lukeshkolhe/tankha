import { Email } from './email.vo';
import { User } from './user.entity';

/** The fields needed to persist a new owner user; the id is assigned by storage. */
export interface NewUser {
  organisationId: string;
  email: Email;
  name: string;
  passwordHash: string;
}

/**
 * Persistence port for users. Implemented by a Prisma adapter in infrastructure.
 * Write methods assume they run inside the caller's UnitOfWork so signup's user
 * insert joins the same transaction as the organisation insert.
 */
export abstract class UserRepository {
  /** The user for a login email, or null if none exists. */
  abstract findByEmail(email: Email): Promise<User | null>;

  /** The user by id (for the session view), or null if none exists. */
  abstract findById(id: string): Promise<User | null>;

  /** Insert the owner user and return it with its assigned id. */
  abstract create(user: NewUser): Promise<User>;
}
