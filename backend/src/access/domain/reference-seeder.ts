/**
 * The default reference lists every new organisation starts with, so the
 * create-employee form has department and designation dropdown values from the
 * very first login (before HR has configured anything).
 */
export const DEFAULT_DEPARTMENTS = ['Engineering', 'Sales', 'Human Resources', 'Finance'] as const;

export const DEFAULT_DESIGNATIONS = ['Engineer', 'Senior Engineer', 'Manager', 'Director'] as const;

/**
 * Port for seeding an organisation's default reference data. Implemented by a
 * Prisma adapter in infrastructure and invoked inside signup's UnitOfWork so the
 * seeded rows commit atomically with the organisation and owner user.
 */
export abstract class ReferenceSeeder {
  abstract seedDefaults(organisationId: string): Promise<void>;
}
