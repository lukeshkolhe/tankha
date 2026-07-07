import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { theme } from '../theme';

/**
 * The one render helper every component test in this app should use instead
 * of Testing Library's bare `render` — Mantine components throw without a
 * MantineProvider ancestor, and anything using TanStack Query needs a
 * QueryClientProvider. `initialEntries` sets the starting route for
 * components that read the URL (filters, params).
 */
export function renderWithProviders(
  ui: ReactElement,
  options: { initialEntries?: string[] } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { initialEntries = ['/'], ...renderOptions } = options;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </QueryClientProvider>
      </MantineProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
