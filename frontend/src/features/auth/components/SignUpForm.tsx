import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { useSignUp } from '../api/useSignUp';
import type { ApiErrorBody } from '../api/api-error';

const signUpSchema = z.object({
  name: z.string().min(1, 'Enter your name.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  organisationName: z.string().min(1, 'Enter your organisation name.'),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

/** Where RequireAuth sends an unauthenticated visitor back to once they sign up. */
interface RedirectState {
  from?: { pathname: string };
}

/**
 * Registers an organisation and its first (owner) user in one step. A 409
 * (email already registered) is surfaced inline on the email field rather
 * than as a banner; any other server error falls back to a generic banner.
 */
export function SignUpForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const signUp = useSignUp();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await signUp.mutateAsync(values);
      login(result);
      const state = location.state as RedirectState | null;
      navigate(state?.from?.pathname ?? '/employees', { replace: true });
    } catch (caught) {
      const error = caught as ApiErrorBody;
      if (error.statusCode === 409) {
        // The details array names the conflicting field (currently always
        // `email`, the one globally-unique login) — target that field, with
        // `email` as the sane default if a future conflict omits `details`.
        const field = (error.details?.[0]?.field as keyof SignUpFormValues | undefined) ?? 'email';
        setError(field, { type: 'server', message: error.message });
      } else {
        setFormError(error.message);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        {formError && (
          <Alert color="red" role="alert" title="Couldn't create your account">
            {formError}
          </Alert>
        )}
        <TextInput label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <TextInput
          label="Organisation name"
          error={errors.organisationName?.message}
          {...register('organisationName')}
        />
        <Button type="submit" loading={isSubmitting || signUp.isPending} fullWidth>
          Create account
        </Button>
      </Stack>
    </form>
  );
}
