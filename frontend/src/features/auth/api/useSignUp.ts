import { useMutation } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import type { ApiErrorBody } from './api-error';

type SignUpInput = components['schemas']['SignUpDto'];
type AuthResult = components['schemas']['AuthResponseDto'];

/**
 * `POST /auth/signup`. Creates the organisation + owner user in one
 * transaction and resolves to the same `AuthResponseDto` shape login does —
 * pass it straight to `useAuth().login(...)`. On a 409 the thrown body's
 * `details` array names the conflicting field (currently always `email`,
 * globally-unique login); the caller surfaces it inline rather than as a
 * generic banner.
 */
export function useSignUp() {
  return useMutation<AuthResult, ApiErrorBody, SignUpInput>({
    mutationFn: async (input) => {
      const { data, error } = await api.POST('/api/v1/auth/signup', { body: input });
      if (error) {
        throw error as ApiErrorBody;
      }
      return data;
    },
  });
}
