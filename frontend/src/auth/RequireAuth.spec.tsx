import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render-with-providers';
import { RequireAuth } from './RequireAuth';
import * as AuthContextModule from './AuthContext';

function renderAt(path: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login page</div>} />
      <Route element={<RequireAuth />}>
        <Route path="/employees" element={<div>Employees page</div>} />
      </Route>
    </Routes>,
    { initialEntries: [path] },
  );
}

describe('RequireAuth', () => {
  it('renders the protected route when authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' },
      organisation: { id: 'org_1', name: 'ACME' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/employees');

    expect(screen.getByText('Employees page')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: undefined,
      organisation: undefined,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/employees');

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows a loader instead of redirecting while the session is still resolving', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: undefined,
      organisation: undefined,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/employees');

    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.queryByText('Employees page')).not.toBeInTheDocument();
  });
});
