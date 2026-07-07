import type { operations } from '../../../api/schema';

export type EmployeeListQuery = NonNullable<
  operations['EmployeesController_list']['parameters']['query']
>;

const STATUS_VALUES = new Set(['ACTIVE', 'INACTIVE']);

/**
 * Pulls the whitelisted `EmployeesController_list` query params straight out of
 * the URL's `URLSearchParams` — the single source of truth for list state (per
 * the workforce module's URL-as-query-key convention). Absent keys are
 * omitted entirely rather than forwarded as `""`, since the API treats a
 * present-but-empty filter differently from an absent one.
 */
export function parseEmployeeListQuery(searchParams: URLSearchParams): EmployeeListQuery {
  const query: EmployeeListQuery = {};

  const page = searchParams.get('page');
  if (page) query.page = page;

  const pageSize = searchParams.get('pageSize');
  if (pageSize) query.pageSize = pageSize;

  const sort = searchParams.get('sort');
  if (sort) query.sort = sort;

  const search = searchParams.get('search');
  if (search) query.search = search;

  const department = searchParams.get('department');
  if (department) query.department = department;

  const designation = searchParams.get('designation');
  if (designation) query.designation = designation;

  const country = searchParams.get('country');
  if (country) query.country = country;

  const status = searchParams.get('status');
  if (status && STATUS_VALUES.has(status)) {
    query.status = status as 'ACTIVE' | 'INACTIVE';
  }

  return query;
}

/**
 * Returns a new `URLSearchParams` with a single key set/cleared, leaving every
 * other param untouched — so one filter control never clobbers another's
 * value. Changing any filter other than `page` itself resets `page`, since a
 * new filter almost certainly invalidates the previous page number.
 */
export function withUpdatedParam(
  current: URLSearchParams,
  key: string,
  value: string | null,
): URLSearchParams {
  const next = new URLSearchParams(current);

  if (value === null || value === '') {
    next.delete(key);
  } else {
    next.set(key, value);
  }

  if (key !== 'page') {
    next.delete('page');
  }

  return next;
}
