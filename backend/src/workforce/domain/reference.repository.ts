/** A tenant-scoped reference row (department or designation). */
export interface ReferenceItem {
  id: string;
  name: string;
}

/** A global ISO country. */
export interface CountryItem {
  code: string;
  name: string;
}

/** A global ISO currency, with the digits needed to render its minor units. */
export interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  minorUnitDigits: number;
}

/**
 * The set of valid reference identifiers, loaded once so `EmployeeValidation`
 * can check membership in O(1) without a query per field. Departments and
 * designations are tenant-scoped; countries and currencies are global.
 */
export interface ValidReferences {
  departmentIds: ReadonlySet<string>;
  designationIds: ReadonlySet<string>;
  countryCodes: ReadonlySet<string>;
  currencyCodes: ReadonlySet<string>;
}

/**
 * Persistence port for reference data (dropdown feeds + validation). Implemented
 * by a tenant-scoped Prisma adapter. The application layer depends only on this
 * abstraction.
 */
export abstract class ReferenceRepository {
  abstract listDepartments(): Promise<ReferenceItem[]>;
  abstract listDesignations(): Promise<ReferenceItem[]>;
  abstract listCountries(): Promise<CountryItem[]>;
  abstract listCurrencies(): Promise<CurrencyItem[]>;

  /** Load valid ids/codes for a single validation pass over an employee row. */
  abstract loadValidReferences(): Promise<ValidReferences>;
}
