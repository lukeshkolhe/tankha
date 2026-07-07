import { describe, expect, it } from 'vitest';
import { resolveBaseUrl } from './resolve-base-url';

describe('resolveBaseUrl', () => {
  it('returns an origin-only URL unchanged', () => {
    expect(resolveBaseUrl('https://tankha-api.onrender.com')).toBe(
      'https://tankha-api.onrender.com',
    );
  });

  it('strips a trailing /api/v1 — every generated path key already carries that prefix', () => {
    expect(resolveBaseUrl('https://tankha-api.onrender.com/api/v1')).toBe(
      'https://tankha-api.onrender.com',
    );
  });

  it('strips a trailing /api/v1/ (with slash)', () => {
    expect(resolveBaseUrl('https://tankha-api.onrender.com/api/v1/')).toBe(
      'https://tankha-api.onrender.com',
    );
  });

  it('returns an empty string unchanged (relative — the Vite dev-server proxy case)', () => {
    expect(resolveBaseUrl('')).toBe('');
  });

  it('returns an empty string when unset', () => {
    expect(resolveBaseUrl(undefined)).toBe('');
  });
});
