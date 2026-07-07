import { useMutation } from '@tanstack/react-query';
import { api } from '../../../api/client';
import type { components } from '../../../api/schema';
import type { ApiErrorBody } from './api-error';

type LogInInput = components['schemas']['LogInDto'];
type AuthResult = components['schemas']['AuthResponseDto'];

/**
 * `POST /auth/login`. Resolves to the same `AuthResponseDto` shape signup
 * does — pass it straight to `useAuth().login(...)`. On a 401 the thrown
 * body's `message` is always the backend's single generic
 * "Email or password is incorrect." string, whether the email is unknown or
 * the password is wrong; the UI must show it verbatim and never blame a
 * specific field, so as not to reveal which emails have accounts.
 */
export function useLogIn() {
  return useMutation<AuthResult, ApiErrorBody, LogInInput>({
    mutationFn: async (input) => {
      const { data, error } = await api.POST('/api/v1/auth/login', { body: input });
      if (error) {
        throw error as ApiErrorBody;
      }
      return data;
    },
  });
}
