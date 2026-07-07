import { Injectable } from '@nestjs/common';
import { NotFoundError, TenantContext } from 'src/platform';
import { OrganisationRepository } from '../domain/organisation.repository';
import { UserRepository } from '../domain/user.repository';
import { organisationView, userView } from './auth-view';
import { SessionView } from './dto/access-commands';

/**
 * Returns the current user and organisation for the authenticated principal. The
 * identity is read only from the request-scoped TenantContext (populated from the
 * verified JWT), never from a caller argument.
 */
@Injectable()
export class GetSessionUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly organisations: OrganisationRepository,
    private readonly tenant: TenantContext,
  ) {}

  async execute(): Promise<SessionView> {
    const user = await this.users.findById(this.tenant.userId);
    if (!user) {
      throw new NotFoundError(`User ${this.tenant.userId} not found.`);
    }
    const organisation = await this.organisations.findById(this.tenant.organisationId);
    if (!organisation) {
      throw new NotFoundError(`Organisation ${this.tenant.organisationId} not found.`);
    }
    return { user: userView(user), organisation: organisationView(organisation) };
  }
}
