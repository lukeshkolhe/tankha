import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../../test/render-with-providers';
import { SignUpForm } from './SignUpForm';
import { api } from '../../../api/client';
import * as AuthContextModule from '../../../auth/AuthContext';

function renderAt(initialPath: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/signup" element={<SignUpForm />} />
      <Route path="/employees" element={<div>Employees page</div>} />
    </Routes>,
    { initialEntries: [initialPath] },
  );
}

const login = vi.fn();

beforeEach(() => {
  login.mockReset();
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: undefined,
    organisation: undefined,
    isAuthenticated: false,
    isLoading: false,
    login,
    logout: vi.fn(),
  });
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>, password = 's3cret-pass') {
  await user.type(screen.getByLabelText('Name'), 'Priya Rao');
  await user.type(screen.getByLabelText('Email'), 'priya@acme.com');
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Organisation name'), 'ACME');
}

describe('SignUpForm', () => {
  it('blocks submission and shows a visible error when the password is under 8 characters', async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(api, 'POST');
    renderAt('/signup');

    await fillValidForm(user, 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('calls the signup mutation with the entered fields on valid submit', async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(api, 'POST').mockResolvedValue({
      data: {
        accessToken: 'token-123',
        user: { id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' },
        organisation: { id: 'org_1', name: 'ACME' },
      },
      error: undefined,
      response: new Response(),
    } as never);
    renderAt('/signup');

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByText('Employees page');
    expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/signup', {
      body: {
        name: 'Priya Rao',
        email: 'priya@acme.com',
        password: 's3cret-pass',
        organisationName: 'ACME',
      },
    });
  });

  it('logs the user in and navigates to /employees after a successful signup', async () => {
    const user = userEvent.setup();
    const authResult = {
      accessToken: 'token-123',
      user: { id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' },
      organisation: { id: 'org_1', name: 'ACME' },
    };
    vi.spyOn(api, 'POST').mockResolvedValue({ data: authResult, error: undefined, response: new Response() } as never);
    renderAt('/signup');

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Employees page')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith(authResult);
  });

  it('shows the email-taken error on the email field when the server returns a 409', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'POST').mockResolvedValue({
      data: undefined,
      error: {
        statusCode: 409,
        error: 'CONFLICT',
        message: 'The email priya@acme.com is already registered.',
        details: [{ field: 'email', reason: 'duplicate' }],
      },
      response: new Response(null, { status: 409 }),
    } as never);
    renderAt('/signup');

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('The email priya@acme.com is already registered.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a generic banner when the server returns an unexpected 400', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'POST').mockResolvedValue({
      data: undefined,
      error: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'organisationName should not be empty.',
      },
      response: new Response(null, { status: 400 }),
    } as never);
    renderAt('/signup');

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('organisationName should not be empty.');
  });
});
