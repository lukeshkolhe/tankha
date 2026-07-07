/** The only fields the list may be ordered by (never raw input into orderBy). */
export type EmployeeSortField = 'lastName' | 'joinDate' | 'salaryTotal';

export type SortDirection = 'asc' | 'desc';

const ALLOWED_FIELDS: ReadonlySet<string> = new Set(['lastName', 'joinDate', 'salaryTotal']);
const DEFAULT_FIELD: EmployeeSortField = 'lastName';
const DEFAULT_DIRECTION: SortDirection = 'asc';

/**
 * A whitelisted list sort parsed from the `field:dir` convention. Any field
 * outside the allow-list — or a malformed value — falls back to the default, so
 * untrusted input can never reach a Prisma `orderBy` key.
 */
export class EmployeeSort {
  private constructor(
    readonly field: EmployeeSortField,
    readonly direction: SortDirection,
  ) {}

  static from(raw?: string): EmployeeSort {
    if (!raw) {
      return new EmployeeSort(DEFAULT_FIELD, DEFAULT_DIRECTION);
    }
    const [rawField, rawDirection] = raw.split(':');
    return new EmployeeSort(toField(rawField), toDirection(rawDirection));
  }
}

function toField(raw: string): EmployeeSortField {
  return ALLOWED_FIELDS.has(raw) ? (raw as EmployeeSortField) : DEFAULT_FIELD;
}

function toDirection(raw: string): SortDirection {
  return raw === 'desc' ? 'desc' : DEFAULT_DIRECTION;
}
