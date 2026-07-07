import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStore } from './token-store';
import { useSession, SESSION_QUERY_KEY } from './useSession';
import type { components } from '../api/schema';

type UserDto = components['schemas']['UserDto'];
type OrganisationDto = components['schemas']['OrganisationDto'];

/** The shape every signup/login mutation resolves to — see AuthResponseDto. */
export interface AuthResult {
  accessToken: string;
  user: UserDto;
  organisation: OrganisationDto;
}

interface AuthContextValue {
  user: UserDto | undefined;
  organisation: OrganisationDto | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(result: AuthResult): void;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The one genuinely global piece of client state (per architecture.md §7):
 * the signed-in user, organisation, and token. `login`/`logout` are the only
 * way the token changes, so the API client (reading through tokenStore) and
 * the session cache (read through TanStack Query) can never disagree.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = tokenStore.get() !== null;
  const session = useSession();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.data?.user,
      organisation: session.data?.organisation,
      isAuthenticated: hasToken && session.data !== undefined,
      isLoading: hasToken && session.isPending,
      login(result) {
        tokenStore.set(result.accessToken);
        queryClient.setQueryData(SESSION_QUERY_KEY, {
          user: result.user,
          organisation: result.organisation,
        });
      },
      logout() {
        tokenStore.clear();
        queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      },
    }),
    [hasToken, session.data, session.isPending, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
