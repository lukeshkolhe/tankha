import { beforeEach, describe, expect, it } from 'vitest';
import { tokenStore } from './token-store';

describe('tokenStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no token has been set', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('persists a token so it can be read back', () => {
    tokenStore.set('abc.def.ghi');
    expect(tokenStore.get()).toBe('abc.def.ghi');
  });

  it('removes the token on clear', () => {
    tokenStore.set('abc.def.ghi');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});
