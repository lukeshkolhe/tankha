import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppShell as MantineAppShell,
  Avatar,
  Group,
  Menu,
  NavLink,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useAuth } from '../auth/AuthContext';
import { themeOther } from '../theme';

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/employees', label: 'Employees' },
  { to: '/dashboard', label: 'Dashboard' },
];

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** The double hairline under the wordmark — an accountant's convention for a final total, borrowed as the brand mark. */
function WordmarkRule() {
  return (
    <Stack gap={2} w={64} mb="xl" aria-hidden>
      <div style={{ height: 1, background: themeOther.ink }} />
      <div style={{ height: 1, background: themeOther.ink }} />
    </Stack>
  );
}

/**
 * The persistent shell every authenticated screen renders inside: the
 * wordmark, the two destinations, and the signed-in org/user — per the
 * design pitch's "quiet, asymmetric shell" layout. Import/export has no
 * standalone route — its controls live on the employee list per the
 * architecture. Feature routes render into the `<Outlet/>`.
 */
export function AppShell() {
  const { user, organisation, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <MantineAppShell navbar={{ width: 208, breakpoint: 'sm' }} padding="lg">
      <MantineAppShell.Navbar p="md" style={{ backgroundColor: themeOther.surface2 }}>
        <Stack justify="space-between" h="100%">
          <div>
            <Text
              component="div"
              fw={600}
              size="19px"
              mb={2}
              style={{ fontFamily: 'var(--mantine-heading-font-family)' }}
            >
              Tankha
            </Text>
            <WordmarkRule />
            <Stack gap={2}>
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  component={RouterNavLink}
                  to={item.to}
                  label={item.label}
                  active={location.pathname.startsWith(item.to)}
                  variant="light"
                  color="verdigris"
                />
              ))}
            </Stack>
          </div>

          {user && organisation && (
            <Menu position="top-start" withArrow shadow="sm">
              <Menu.Target>
                <UnstyledButton
                  aria-label="Account menu"
                  py="sm"
                  w="100%"
                  style={{ borderTop: `1px solid ${themeOther.line}` }}
                >
                  <Group gap="xs">
                    <Avatar color="verdigris" radius="xl" size={28}>
                      {initialsOf(user.name)}
                    </Avatar>
                    <div>
                      <Text size="12.5px" fw={600}>
                        {organisation.name}
                      </Text>
                      <Text size="11.5px" c="dimmed">
                        {user.name}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={handleLogout}>Log out</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Stack>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
