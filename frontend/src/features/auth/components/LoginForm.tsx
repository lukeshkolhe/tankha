import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { useLogIn } from '../api/useLogIn';
import type { ApiErrorBody } from '../api/api-error';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Where RequireAuth sends an unauthenticated visitor back to once they sign in. */
interface RedirectState {
  from?: { pathname: string };
}

/**
 * Email + password sign-in. On a 401 the server's exact generic message is
 * shown in a single banner — never a field-specific error — so the UI can't
 * be used to probe which emails have accounts.
 */
export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const logIn = useLogIn();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await logIn.mutateAsync(values);
      login(result);
      const state = location.state as RedirectState | null;
      navigate(state?.from?.pathname ?? '/employees', { replace: true });
    } catch {
      // Surfaced to the user via logIn.error below; nothing further to do.
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        {logIn.isError && (
          <Alert color="red" role="alert" title="Sign-in failed">
            {(logIn.error as ApiErrorBody).message}
          </Alert>
        )}
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting || logIn.isPending} fullWidth>
          Log in
        </Button>
      </Stack>
    </form>
  );
}
