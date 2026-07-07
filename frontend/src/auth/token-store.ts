const STORAGE_KEY = 'tankha.accessToken';

/**
 * The one place the access token lives outside React. Both the API client
 * (a plain module, needs the token for its auth header) and AuthContext (a
 * React provider) read/write through here, so they can never drift out of
 * sync. Persisted to localStorage so a page refresh doesn't sign HR out.
 */
export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  },
  set(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
