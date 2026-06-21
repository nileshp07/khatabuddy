/**
 * JS mirror of the CSS variables in global.css, for consumers that can't use
 * Tailwind classes — StatusBar, gradients, the bottom-sheet backdrop, Reanimated
 * interpolations, etc. Keep in sync with global.css.
 */
export const palette = {
  light: {
    canvas: '#FAF5EC',
    surface: '#FFFDF8',
    sunken: '#F3ECDF',
    line: '#E7DDCB',
    ink: '#211C15',
    muted: '#6F6655',
    primary: '#126B5B',
    primaryInk: '#FBFBF8',
    accent: '#E0913A',
    accentInk: '#2A1C08',
    positive: '#126B5B',
    negative: '#C0492C',
  },
  dark: {
    canvas: '#15120D',
    surface: '#1F1B14',
    sunken: '#110E0A',
    line: '#352F25',
    ink: '#F3ECDD',
    muted: '#A89B83',
    primary: '#3FA88F',
    primaryInk: '#07140F',
    accent: '#E9A94E',
    accentInk: '#1E1406',
    positive: '#4FB89C',
    negative: '#E0795C',
  },
} as const;

export type Scheme = keyof typeof palette;
export type Palette = (typeof palette)[Scheme];
