import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { AppShell } from './AppShell';
import { LoginPage } from '../features/auth/routes/LoginPage';
import { SignUpPage } from '../features/auth/routes/SignUpPage';
import { EmployeeListPage } from '../features/employees/routes/EmployeeListPage';
import { EmployeeCreatePage } from '../features/employees/routes/EmployeeCreatePage';
import { EmployeeDetailPage } from '../features/employees/routes/EmployeeDetailPage';
import { EmployeeEditPage } from '../features/employees/routes/EmployeeEditPage';
import { DashboardPage } from '../features/insights/routes/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignUpPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/employees" replace /> },
          { path: 'employees', element: <EmployeeListPage /> },
          { path: 'employees/new', element: <EmployeeCreatePage /> },
          { path: 'employees/:id', element: <EmployeeDetailPage /> },
          { path: 'employees/:id/edit', element: <EmployeeEditPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
        ],
      },
    ],
  },
]);
