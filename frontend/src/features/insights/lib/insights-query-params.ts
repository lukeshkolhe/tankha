import type { operations } from '../../../api/schema';

export type InsightsQuery = NonNullable<
  operations['InsightsController_overview']['parameters']['query']
>;

const STATUS_VALUES = new Set(['ACTIVE', 'INACTIVE']);

/**
 * Pulls the shared insights filter set straight out of `URLSearchParams` — the
 * same `search`/`department`/`country`/`status` whitelist the employee list
 * uses, so drilling into one view and checking the other never disagree
 * about which population is shown (FR-5.3). Absent keys are omitted rather
 * than forwarded as `""`.
 */
export function parseInsightsQuery(searchParams: URLSearchParams): InsightsQuery {
  const query: InsightsQuery = {};

  const search = searchParams.get('search');
  if (search) query.search = search;

  const department = searchParams.get('department');
  if (department) query.department = department;

  const country = searchParams.get('country');
  if (country) query.country = country;

  const status = searchParams.get('status');
  if (status && STATUS_VALUES.has(status)) {
    query.status = status as 'ACTIVE' | 'INACTIVE';
  }

  return query;
}

/**
 * Returns a new `URLSearchParams` with a single key set/cleared, leaving
 * every other param untouched — so changing one filter control never
 * clobbers another's value.
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

  return next;
}
