import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Center, Text } from '@mantine/core';
import { RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';

/**
 * Placeholder for a route not yet wired to its feature page. Each is replaced
 * by the real import once the corresponding feature module lands — see the
 * integration step in the project plan. Keeping these inline (not under
 * `features/`) avoids any file-path collision with feature work landing in
 * parallel.
 */
function ComingSoon({ label }: { label: string }) {
  return (
    <Center h="60vh">
      <Text c="dimmed">{label} — coming soon</Text>
    </Center>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <ComingSoon label="Login" /> },
  { path: '/signup', element: <ComingSoon label="Sign up" /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/employees" replace /> },
          { path: 'employees', element: <ComingSoon label="Employees" /> },
          { path: 'employees/new', element: <ComingSoon label="Add employee" /> },
          { path: 'employees/:id', element: <ComingSoon label="Employee detail" /> },
          { path: 'employees/:id/edit', element: <ComingSoon label="Edit employee" /> },
          { path: 'dashboard', element: <ComingSoon label="Dashboard" /> },
          { path: 'import-export', element: <ComingSoon label="Import & export" /> },
        ],
      },
    ],
  },
]);
