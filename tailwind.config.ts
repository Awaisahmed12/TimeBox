import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0a08', light: '#fafaf7' },
        surface: { DEFAULT: '#111110', light: '#ffffff' },
        border: { DEFAULT: '#2a2a26', light: '#e6e6e0' },
        accent: '#c8f542',
        accent2: '#f5a623',
        'text-primary': { DEFAULT: '#e8e8e0', light: '#1a1a18' },
        muted: { DEFAULT: '#6b6b60', light: '#8a8a80' },
      },
      fontFamily: {
        mono: ['var(--font-dm-mono)', 'ui-monospace', 'monospace'],
        serif: ['var(--font-fraunces)', 'ui-serif', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
