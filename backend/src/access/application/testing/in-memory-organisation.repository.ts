import { Organisation } from '../../domain/organisation.entity';
import { OrganisationRepository } from '../../domain/organisation.repository';

/** In-memory OrganisationRepository for use-case unit tests. */
export class InMemoryOrganisationRepository extends OrganisationRepository {
  private readonly byId = new Map<string, Organisation>();
  private sequence = 0;

  async create(name: string): Promise<Organisation> {
    const id = `org_${++this.sequence}`;
    const organisation = Organisation.of(id, name);
    this.byId.set(id, organisation);
    return organisation;
  }

  async findById(id: string): Promise<Organisation | null> {
    return this.byId.get(id) ?? null;
  }
}
