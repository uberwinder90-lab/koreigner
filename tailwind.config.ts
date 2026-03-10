import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0284c7',
          hover: '#0369a1',
          light: '#f0f9ff',
        },
        surface: '#ffffff',
        background: '#fafaf9',
        border: '#e4e4e7',
        text: {
          primary: '#18181b',
          secondary: '#52525b',
          tertiary: '#71717a',
        },
        danger: '#dc2626',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
