import { describe, expect, it } from 'vitest';
import { parseInsightsQuery, withUpdatedParam } from './insights-query-params';

describe('parseInsightsQuery', () => {
  it('extracts only the whitelisted search/department/country/status params', () => {
    const searchParams = new URLSearchParams(
      'search=priya&department=dept_1&country=IN&status=ACTIVE&page=2',
    );

    expect(parseInsightsQuery(searchParams)).toEqual({
      search: 'priya',
      department: 'dept_1',
      country: 'IN',
      status: 'ACTIVE',
    });
  });

  it('omits absent keys entirely rather than forwarding empty strings', () => {
    const searchParams = new URLSearchParams('search=priya');

    expect(parseInsightsQuery(searchParams)).toEqual({ search: 'priya' });
  });

  it('ignores an invalid status value', () => {
    const searchParams = new URLSearchParams('status=ON_LEAVE');

    expect(parseInsightsQuery(searchParams)).toEqual({});
  });
});

describe('withUpdatedParam', () => {
  it('sets a new param while leaving every other param untouched', () => {
    const current = new URLSearchParams('search=priya&status=ACTIVE');

    const next = withUpdatedParam(current, 'department', 'dept_1');

    expect(next.get('search')).toBe('priya');
    expect(next.get('status')).toBe('ACTIVE');
    expect(next.get('department')).toBe('dept_1');
  });

  it('clears a param when passed null without clobbering the others', () => {
    const current = new URLSearchParams('search=priya&department=dept_1&status=ACTIVE');

    const next = withUpdatedParam(current, 'department', null);

    expect(next.has('department')).toBe(false);
    expect(next.get('search')).toBe('priya');
    expect(next.get('status')).toBe('ACTIVE');
  });

  it('clears a param when passed an empty string', () => {
    const current = new URLSearchParams('search=priya');

    const next = withUpdatedParam(current, 'search', '');

    expect(next.has('search')).toBe(false);
  });
});
