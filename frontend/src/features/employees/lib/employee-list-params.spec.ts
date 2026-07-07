import { describe, expect, it } from 'vitest';
import { parseEmployeeListQuery, withUpdatedParam } from './employee-list-params';

describe('parseEmployeeListQuery', () => {
  it('extracts every whitelisted key present in the URL', () => {
    const searchParams = new URLSearchParams(
      'page=2&pageSize=50&sort=lastName:asc&search=ravi&department=dep_1&designation=des_1&country=IN&status=ACTIVE',
    );

    expect(parseEmployeeListQuery(searchParams)).toEqual({
      page: '2',
      pageSize: '50',
      sort: 'lastName:asc',
      search: 'ravi',
      department: 'dep_1',
      designation: 'des_1',
      country: 'IN',
      status: 'ACTIVE',
    });
  });

  it('omits keys that are absent from the URL rather than sending empty strings', () => {
    const searchParams = new URLSearchParams('search=ravi');

    expect(parseEmployeeListQuery(searchParams)).toEqual({ search: 'ravi' });
  });

  it('ignores an invalid status value instead of forwarding it to the API', () => {
    const searchParams = new URLSearchParams('status=BOGUS');

    expect(parseEmployeeListQuery(searchParams)).toEqual({});
  });

  it('returns an empty object for an empty URL', () => {
    expect(parseEmployeeListQuery(new URLSearchParams())).toEqual({});
  });
});

describe('withUpdatedParam', () => {
  it('sets a new param while preserving existing ones', () => {
    const current = new URLSearchParams('search=ravi&country=IN');

    const next = withUpdatedParam(current, 'department', 'dep_1');

    expect(next.toString()).toBe('search=ravi&country=IN&department=dep_1');
  });

  it('overwrites an existing param without duplicating it', () => {
    const current = new URLSearchParams('country=IN&status=ACTIVE');

    const next = withUpdatedParam(current, 'country', 'US');

    expect(next.toString()).toBe('country=US&status=ACTIVE');
  });

  it('removes the param when the new value is null or empty, preserving others', () => {
    const current = new URLSearchParams('search=ravi&country=IN');

    const next = withUpdatedParam(current, 'country', null);

    expect(next.toString()).toBe('search=ravi');
  });

  it('resets the page param whenever a filter other than page itself changes', () => {
    const current = new URLSearchParams('page=3&country=IN');

    const next = withUpdatedParam(current, 'country', 'US');

    expect(next.get('page')).toBeNull();
  });

  it('does not reset page when the page param itself is the one being updated', () => {
    const current = new URLSearchParams('page=3&country=IN');

    const next = withUpdatedParam(current, 'page', '4');

    expect(next.get('page')).toBe('4');
    expect(next.get('country')).toBe('IN');
  });
});
