import {
  Badge,
  Button,
  Card,
  createTheme,
  NavLink,
  Table,
  type MantineColorsTuple,
} from '@mantine/core';

/**
 * Maps the design-pitch tokens onto Mantine's theme object. Verdigris is the
 * one brand accent (actions, focus, links); brass/brick are reserved for
 * semantic state (a raise, a deactivation/error) and are read from
 * `themeOther` rather than the Mantine color system, so they can never be
 * mistaken for "just another palette color."
 *
 * Component-level theming (`theme.components`) restyles every instance of a
 * component globally — Card/Table/Badge/Button/NavLink all pick up the
 * pitch's flat, hairline-bordered, no-shadow look with zero changes needed at
 * individual call sites. This is the supported Mantine mechanism for exactly
 * this ("make every Table look like X"), rather than fighting CSS
 * specificity with global element selectors.
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
    lineSoft: string;
    surface2: string;
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
  lineSoft: '#E9EBE5',
  surface2: '#FBFBF9',
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
    sizes: {
      h1: { fontSize: '32px', lineHeight: '1.2' },
      h2: { fontSize: '26px', lineHeight: '1.25' },
      h3: { fontSize: '20px', lineHeight: '1.3' },
    },
  },
  defaultRadius: 'sm',
  radius: {
    sm: '3px',
    md: '4px',
  },
  primaryShade: 6,
  other: themeOther,
  components: {
    // Flat, hairline-bordered, no drop shadow — the pitch never uses shadows
    // for chrome, only whitespace and 1px lines to separate content.
    Card: Card.extend({
      defaultProps: { withBorder: true, shadow: 'none', radius: 'md' },
      styles: {
        root: { borderColor: themeOther.line },
      },
    }),
    // Dense, uppercase small-caps-style headers; hairline row dividers; a
    // quiet accent-tinted hover instead of a shaded stripe.
    Table: Table.extend({
      styles: {
        table: { fontSize: '13.5px' },
        thead: { backgroundColor: themeOther.surface2 },
        th: {
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
          color: themeOther.inkMuted,
          borderBottom: `1px solid ${themeOther.line}`,
          whiteSpace: 'nowrap',
        },
        td: {
          borderBottom: `1px solid ${themeOther.lineSoft}`,
          verticalAlign: 'middle',
        },
        tr: {
          '&:hover td': { backgroundColor: 'rgba(20, 99, 86, 0.08)' },
        },
      },
    }),
    // Every status/currency Badge in the app gets the pitch's dot-indicator
    // treatment for free — no call site needs to add it individually.
    Badge: Badge.extend({
      defaultProps: { radius: 'xl' },
      styles: {
        root: { fontWeight: 600, textTransform: 'none' },
        label: { display: 'flex', alignItems: 'center', gap: '5px' },
        section: { marginInlineEnd: 0 },
      },
    }),
    Button: Button.extend({
      defaultProps: { radius: 'sm' },
      styles: (_theme, params) => ({
        root:
          params.variant === 'default' || params.variant === 'outline'
            ? { borderColor: themeOther.line, fontWeight: 600 }
            : { fontWeight: 600 },
      }),
    }),
    // The sidebar's nav items: quiet by default, a soft accent wash + accent
    // text + heavier weight when active — matching .rail-nav li a.active.
    NavLink: NavLink.extend({
      styles: {
        root: {
          fontSize: '13.5px',
          fontWeight: 500,
          borderRadius: '3px',
          '&[data-active]': {
            backgroundColor: 'rgba(20, 99, 86, 0.08)',
            color: themeOther.ink,
          },
        },
        label: {
          '[data-active] &': { color: '#146356', fontWeight: 600 },
        },
      },
    }),
  },
});
