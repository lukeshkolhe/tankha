import { Organisation } from '../domain/organisation.entity';
import { User } from '../domain/user.entity';
import { OrganisationView, UserView } from './dto/access-commands';

/** Project a User entity onto its safe API shape (no password hash). */
export function userView(user: User): UserView {
  return { id: user.id, name: user.name, email: user.email.value };
}

/** Project an Organisation entity onto its API shape. */
export function organisationView(organisation: Organisation): OrganisationView {
  return { id: organisation.id, name: organisation.name };
}
