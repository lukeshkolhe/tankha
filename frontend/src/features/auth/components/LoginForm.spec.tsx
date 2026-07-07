import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, Navigate } from 'react-router-dom';
import { renderWithProviders } from '../../../test/render-with-providers';
import { LoginForm } from './LoginForm';
import { api } from '../../../api/client';
import * as AuthContextModule from '../../../auth/AuthContext';

function renderAt(initialPath: string) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/protected"
        element={<Navigate to="/login" state={{ from: { pathname: '/dashboard' } }} replace />}
      />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/employees" element={<div>Employees page</div>} />
      <Route path="/dashboard" element={<div>Dashboard page</div>} />
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

describe('LoginForm', () => {
  it('blocks submission and shows a visible error when the email is not valid', async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(api, 'POST');
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('blocks submission and shows a visible error when the password is blank', async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(api, 'POST');
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'priya@acme.com');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter your password.')).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('calls the login mutation with the entered email and password on valid submit', async () => {
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
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'priya@acme.com');
    await user.type(screen.getByLabelText('Password'), 's3cret-pass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('Employees page');
    expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/login', {
      body: { email: 'priya@acme.com', password: 's3cret-pass' },
    });
  });

  it('logs the user in and navigates to /employees after a successful login', async () => {
    const user = userEvent.setup();
    const authResult = {
      accessToken: 'token-123',
      user: { id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' },
      organisation: { id: 'org_1', name: 'ACME' },
    };
    vi.spyOn(api, 'POST').mockResolvedValue({ data: authResult, error: undefined, response: new Response() } as never);
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'priya@acme.com');
    await user.type(screen.getByLabelText('Password'), 's3cret-pass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Employees page')).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith(authResult);
  });

  it('restores the originally requested page after login when redirected there by RequireAuth', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'POST').mockResolvedValue({
      data: {
        accessToken: 'token-123',
        user: { id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' },
        organisation: { id: 'org_1', name: 'ACME' },
      },
      error: undefined,
      response: new Response(),
    } as never);
    renderAt('/protected');

    await user.type(screen.getByLabelText('Email'), 'priya@acme.com');
    await user.type(screen.getByLabelText('Password'), 's3cret-pass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  it('shows the generic incorrect-credentials message on a 401, not a field-specific one', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'POST').mockResolvedValue({
      data: undefined,
      error: { statusCode: 401, error: 'UNAUTHORIZED', message: 'Email or password is incorrect.' },
      response: new Response(null, { status: 401 }),
    } as never);
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'unknown@acme.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(screen.queryByText(/enter a valid email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/enter your password/i)).not.toBeInTheDocument();
  });

  it('shows the exact same generic message whether the email is unknown or the password is wrong', async () => {
    const user = userEvent.setup();
    const unauthorizedResponse = {
      data: undefined,
      error: { statusCode: 401, error: 'UNAUTHORIZED', message: 'Email or password is incorrect.' },
      response: new Response(null, { status: 401 }),
    } as never;

    vi.spyOn(api, 'POST').mockResolvedValueOnce(unauthorizedResponse);
    const { unmount } = renderAt('/login');
    await user.type(screen.getByLabelText('Email'), 'unknown@acme.com');
    await user.type(screen.getByLabelText('Password'), 'anything');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    const firstMessage = (await screen.findByRole('alert')).textContent;
    unmount();

    vi.spyOn(api, 'POST').mockResolvedValueOnce(unauthorizedResponse);
    renderAt('/login');
    await user.type(screen.getByLabelText('Email'), 'priya@acme.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    const secondMessage = (await screen.findByRole('alert')).textContent;

    expect(firstMessage).toBe(secondMessage);
  });
});
