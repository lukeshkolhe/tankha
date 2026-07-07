import { ReferenceSeeder } from '../../domain/reference-seeder';

/**
 * ReferenceSeeder fake for unit tests: records the organisation ids it was asked
 * to seed so a test can assert signup seeded exactly the new organisation.
 */
export class RecordingReferenceSeeder extends ReferenceSeeder {
  readonly seededOrganisationIds: string[] = [];

  async seedDefaults(organisationId: string): Promise<void> {
    this.seededOrganisationIds.push(organisationId);
  }
}
