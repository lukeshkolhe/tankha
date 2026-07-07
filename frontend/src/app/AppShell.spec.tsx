import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render-with-providers';
import { AppShell } from './AppShell';
import * as AuthContextModule from '../auth/AuthContext';

function mockAuth(overrides: Partial<ReturnType<typeof AuthContextModule.useAuth>> = {}) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: { id: 'usr_1', name: 'Priya Rao', email: 'priya@acme.com' },
    organisation: { id: 'org_1', name: 'ACME' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

function renderShell() {
  return renderWithProviders(
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<div>Page content</div>} />
      </Route>
    </Routes>,
  );
}

describe('AppShell', () => {
  it('does not log out just from clicking the user/org card', async () => {
    const logout = vi.fn();
    mockAuth({ logout });
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByText('ACME'));

    expect(logout).not.toHaveBeenCalled();
  });

  it('offers an explicit "Log out" option that signs the user out when chosen', async () => {
    const logout = vi.fn();
    mockAuth({ logout });
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: /account menu/i }));
    await user.click(await screen.findByRole('menuitem', { name: /log out/i }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('shows the signed-in organisation and user name', () => {
    mockAuth();
    renderShell();

    expect(screen.getByText('ACME')).toBeInTheDocument();
    expect(screen.getByText('Priya Rao')).toBeInTheDocument();
  });
});
