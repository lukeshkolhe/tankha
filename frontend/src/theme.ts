import { createTheme, type MantineColorsTuple } from '@mantine/core';

/**
 * Maps the design-pitch tokens onto Mantine's theme object. Verdigris is the
 * one brand accent (actions, focus, links); brass/brick are reserved for
 * semantic state (a raise, a deactivation/error) and are read from
 * `themeOther` rather than the Mantine color system, so they can never be
 * mistaken for "just another palette color."
 */

/**
 * Mantine's `MantineThemeOther` is an empty interface by design, meant to be
 * augmented (see mantine.dev/theming/theme-object/#other) — this makes
 * `useMantineTheme().other` properly typed for any component that reaches it
 * through the hook.
 */
declare module '@mantine/core' {
  export interface MantineThemeOther {
    paper: string;
    ink: string;
    inkSoft: string;
    inkMuted: string;
    line: string;
    brass: string;
    brassSoft: string;
    brick: string;
    brickSoft: string;
    currencyColors: Record<string, string>;
  }
}

const verdigris: MantineColorsTuple = [
  '#eaf3f1',
  '#d3e6e2',
  '#a8ccc4',
  '#7bb1a5',
  '#559a8b',
  '#3d8c7a',
  '#146356',
  '#0d4a40',
  '#0a3b33',
  '#062822',
];

/**
 * The concrete, non-optional token values. `createTheme()`'s return type is
 * `PartialDeep<MantineTheme>` (it's designed to accept a *partial* override),
 * so `other` types as possibly-undefined on the `theme` export below no
 * matter how `MantineThemeOther` is augmented. Modules that only need the
 * design tokens (not Mantine component config) should import `themeOther`
 * directly instead of reaching through `theme.other`.
 */
export const themeOther = {
  paper: '#F5F6F2',
  ink: '#14171D',
  inkSoft: '#4B5058',
  inkMuted: '#82877E',
  line: '#DBDED6',
  brass: '#8C6423',
  brassSoft: 'rgba(140, 100, 35, 0.10)',
  brick: '#9E4234',
  brickSoft: 'rgba(158, 66, 52, 0.10)',
  // Fixed-order currency identity for charts — never reassigned per chart,
  // validated for CVD separation against the app's paper/ink surfaces.
  currencyColors: {
    INR: '#2a78d6',
    USD: '#1baf7a',
    GBP: '#eda100',
    EUR: '#008300',
    JPY: '#4a3aa7',
    SGD: '#e34948',
    AED: '#e87ba4',
    AUD: '#eb6834',
  } as Record<string, string>,
} as const;

export const theme = createTheme({
  primaryColor: 'verdigris',
  colors: { verdigris },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    '"SF Mono", ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, "Roboto Mono", Menlo, monospace',
  headings: {
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, Georgia, serif',
    fontWeight: '600',
  },
  defaultRadius: 'sm',
  radius: {
    sm: '3px',
    md: '4px',
  },
  primaryShade: 6,
  other: themeOther,
});
