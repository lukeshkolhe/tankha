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

