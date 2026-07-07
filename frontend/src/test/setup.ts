import '@testing-library/jest-dom/vitest';

// jsdom has no matchMedia implementation; Mantine's color-scheme detection
// needs one. A minimal stub is enough for tests — no real media queries fire.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

// jsdom has no ResizeObserver either; Mantine's ScrollArea (used by Select,
// Combobox, and anything with a scrollable dropdown) needs one. A no-op stub
// is enough — tests don't depend on real resize notifications.
if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

