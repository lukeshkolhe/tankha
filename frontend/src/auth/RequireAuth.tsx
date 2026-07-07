import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from './AuthContext';

/**
 * Route guard wrapping every authenticated route (per architecture.md §3:
 * "there is no publicly readable data"). Redirects to /login, preserving the
 * attempted location so a future "return to where you were" flow has it.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader color="verdigris" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
