import { Email } from '../../domain/email.vo';
import { User } from '../../domain/user.entity';
import { NewUser, UserRepository } from '../../domain/user.repository';

/**
 * In-memory UserRepository for use-case unit tests. Assigns sequential ids and
 * indexes users by their normalised email, mirroring the DB's unique constraint.
 */
export class InMemoryUserRepository extends UserRepository {
  private readonly byId = new Map<string, User>();
  private sequence = 0;

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.byId.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async create(user: NewUser): Promise<User> {
    const id = `usr_${++this.sequence}`;
    const created = User.of(id, user.organisationId, user.email, user.name, user.passwordHash);
    this.byId.set(id, created);
    return created;
  }
}
