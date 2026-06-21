/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: rgb('--c-canvas'),
        surface: rgb('--c-surface'),
        sunken: rgb('--c-sunken'),
        line: rgb('--c-line'),
        // Text
        ink: rgb('--c-ink'),
        muted: rgb('--c-muted'),
        // Brand
        primary: {
          DEFAULT: rgb('--c-primary'),
          ink: rgb('--c-primary-ink'),
        },
        accent: {
          DEFAULT: rgb('--c-accent'),
          ink: rgb('--c-accent-ink'),
        },
        // Semantic money colors
        positive: rgb('--c-positive'),
        negative: rgb('--c-negative'),
      },
      fontFamily: {
        // Fraunces — characterful serif for display & balances
        display: ['Fraunces_700Bold'],
        'display-md': ['Fraunces_600SemiBold'],
        serif: ['Fraunces_500Medium'],
        // Geist — clean UI sans
        sans: ['Geist_400Regular'],
        'sans-md': ['Geist_500Medium'],
        'sans-sb': ['Geist_600SemiBold'],
        'sans-bold': ['Geist_700Bold'],
        // Geist Mono — tabular money figures
        mono: ['GeistMono_500Medium'],
        'mono-sb': ['GeistMono_600SemiBold'],
      },
      borderRadius: {
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
};
