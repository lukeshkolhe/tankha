import {
  CountryItem,
  CurrencyItem,
  ReferenceItem,
  ReferenceRepository,
  ValidReferences,
} from '../../domain/reference.repository';

/** Seed data for the in-memory reference repository used in unit tests. */
export interface ReferenceSeed {
  departments?: ReferenceItem[];
  designations?: ReferenceItem[];
  countries?: CountryItem[];
  currencies?: CurrencyItem[];
}

/**
 * In-memory ReferenceRepository for use-case unit tests. Serves the seeded
 * dropdown rows and derives the `ValidReferences` sets from them, so validation
 * of unknown ids/codes can be exercised without a database.
 */
export class InMemoryReferenceRepository extends ReferenceRepository {
  private readonly departments: ReferenceItem[];
  private readonly designations: ReferenceItem[];
  private readonly countries: CountryItem[];
  private readonly currencies: CurrencyItem[];

  constructor(seed: ReferenceSeed = {}) {
    super();
    this.departments = seed.departments ?? [{ id: 'dep_1', name: 'Engineering' }];
    this.designations = seed.designations ?? [{ id: 'des_1', name: 'Senior Engineer' }];
    this.countries = seed.countries ?? [{ code: 'IN', name: 'India' }];
    this.currencies = seed.currencies ?? [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', minorUnitDigits: 2 },
    ];
  }

  async listDepartments(): Promise<ReferenceItem[]> {
    return this.departments;
  }

  async listDesignations(): Promise<ReferenceItem[]> {
    return this.designations;
  }

  async listCountries(): Promise<CountryItem[]> {
    return this.countries;
  }

  async listCurrencies(): Promise<CurrencyItem[]> {
    return this.currencies;
  }

  async loadValidReferences(): Promise<ValidReferences> {
    return {
      departmentIds: new Set(this.departments.map((item) => item.id)),
      designationIds: new Set(this.designations.map((item) => item.id)),
      countryCodes: new Set(this.countries.map((item) => item.code)),
      currencyCodes: new Set(this.currencies.map((item) => item.code)),
    };
  }
}
