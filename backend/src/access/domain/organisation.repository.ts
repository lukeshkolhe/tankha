import { Organisation } from './organisation.entity';

/**
 * Persistence port for organisations. Implemented by a Prisma adapter in
 * infrastructure. `create` runs inside signup's UnitOfWork so the organisation
 * and its owner user commit atomically.
 */
export abstract class OrganisationRepository {
  /** Insert an organisation and return it with its assigned id. */
  abstract create(name: string): Promise<Organisation>;

  /** The organisation by id (for the session view), or null if none exists. */
  abstract findById(id: string): Promise<Organisation | null>;
}
