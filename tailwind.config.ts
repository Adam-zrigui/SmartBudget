import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'], // use a class strategy for theme toggling
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "var(--primary)",
          "primary-content": "var(--primary-foreground)",
          "secondary": "var(--secondary)",
          "secondary-content": "var(--secondary-foreground)",
          "accent": "var(--accent)",
          "accent-content": "var(--accent-foreground)",
          "neutral": "var(--background)",
          "base-100": "var(--background)",
          "base-200": "var(--card)",
          "base-300": "var(--popover)",
          "base-content": "var(--foreground)",
        },
      },
      {
        dark: {
          "primary": "var(--primary)",
          "primary-content": "var(--primary-foreground)",
          "secondary": "var(--secondary)",
          "secondary-content": "var(--secondary-foreground)",
          "accent": "var(--accent)",
          "accent-content": "var(--accent-foreground)",
          "neutral": "var(--background)",
          "base-100": "var(--background)",
          "base-200": "var(--card)",
          "base-300": "var(--popover)",
          "base-content": "var(--foreground)",
        },
      },
    ],
    darkTheme: "dark",
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
}

export default config
